/** map-dyoa-server로 나가는 fetch 공통 (순환 import 없음) */

import { log } from "next-axiom";

import { MapDyoaServerRequestFailedError } from "@/lib/map-dyoa-server-client-error";

const REQUEST_ID_HEADER = "x-request-id";

function logTargetUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    const q = url.indexOf("?");
    return q === -1 ? url : url.slice(0, q);
  }
}

function buildFetchLogFields(
  url: string,
  init: RequestInit | undefined,
  headers: Headers,
  attempt: number,
  durationMs: number,
  extra?: { status?: number; error?: unknown },
): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    target: "map-dyoa-server",
    method: (init?.method ?? "GET").toUpperCase(),
    url: logTargetUrl(url),
    requestId: headers.get(REQUEST_ID_HEADER) ?? undefined,
    attempt: attempt + 1,
    durationMs: Math.round(durationMs),
  };
  if (extra?.status !== undefined) fields.status = extra.status;
  if (extra?.error !== undefined) {
    fields.error =
      extra.error instanceof Error ? extra.error.message : String(extra.error);
  }
  return fields;
}

function mergeRequestIdHeaders(init?: RequestInit): Headers {
  const headers = new Headers(init?.headers);
  if (!headers.has(REQUEST_ID_HEADER)) {
    headers.set(REQUEST_ID_HEADER, crypto.randomUUID());
  }
  return headers;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const RETRYABLE_ERR_CODES = new Set([
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EPIPE',
  /** undici: 상대가 소켓을 먼저 닫음 등 */
  'UND_ERR_SOCKET',
  'UND_ERR_CONNECT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_BODY_TIMEOUT',
])

function errorChainHasRetryableCode(e: unknown): boolean {
  let cur: unknown = e
  const seen = new Set<unknown>()
  for (let i = 0; i < 8 && cur && typeof cur === 'object' && !seen.has(cur); i++) {
    seen.add(cur)
    const o = cur as Record<string, unknown>
    if (typeof o.code === 'string' && RETRYABLE_ERR_CODES.has(o.code)) return true
    cur = o.cause
  }
  return false
}

function isRetryableFetchError(e: unknown): boolean {
  if (e instanceof TypeError) {
    const m = String(e.message)
    if (m.includes('fetch') || m.includes('Failed to fetch')) return true
  }
  if (errorChainHasRetryableCode(e)) return true
  return false
}

const RETRYABLE_HTTP = new Set([502, 503, 504])

/**
 * TLS 끊김·일시 네트워크 오류 등에 대해 짧은 백오프로 재시도.
 * @param maxRetries 추가 시도 횟수(기본 2 → 최대 3번 요청)
 */
export async function fetchWithBackoff(
  url: string,
  init?: RequestInit,
  opts?: { maxRetries?: number; baseDelayMs?: number },
): Promise<Response> {
  const maxRetries = opts?.maxRetries ?? 2
  const baseDelayMs = opts?.baseDelayMs ?? 300
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const headers = mergeRequestIdHeaders(init);
    const started = performance.now();
    try {
      const res = await fetch(url, { ...init, headers });
      const durationMs = performance.now() - started;
      if (RETRYABLE_HTTP.has(res.status) && attempt < maxRetries) {
        log.warn(
          "map-dyoa-server.fetch retry",
          buildFetchLogFields(url, init, headers, attempt, durationMs, {
            status: res.status,
          }),
        );
        await sleep(baseDelayMs * 2 ** attempt);
        continue;
      }
      const level = res.ok ? "info" : "warn";
      log[level](
        "map-dyoa-server.fetch",
        buildFetchLogFields(url, init, headers, attempt, durationMs, {
          status: res.status,
        }),
      );
      return res;
    } catch (e) {
      lastError = e;
      const durationMs = performance.now() - started;
      if (!isRetryableFetchError(e) || attempt >= maxRetries) {
        log.error(
          "map-dyoa-server.fetch failed",
          buildFetchLogFields(url, init, headers, attempt, durationMs, {
            error: e,
          }),
        );
        throw e;
      }
      log.warn(
        "map-dyoa-server.fetch retry",
        buildFetchLogFields(url, init, headers, attempt, durationMs, {
          error: e,
        }),
      );
      await sleep(baseDelayMs * 2 ** attempt);
    }
  }
  throw lastError
}

export async function readJsonSafely<T>(
  res: Response,
  fallbackMessage: string,
): Promise<T> {
  const raw = await res.text()
  let data: unknown = {}
  if (raw.trim().length > 0) {
    try {
      data = JSON.parse(raw)
    } catch {
      data = { message: raw }
    }
  }
  if (!res.ok) {
    const body = data as Record<string, unknown>;
    const requestId = res.headers.get(REQUEST_ID_HEADER)?.trim() ?? null;

    const nestedError = body.error;
    let serverErrorCode: string | undefined;
    if (typeof nestedError === "string") {
      serverErrorCode = nestedError;
    } else if (
      nestedError &&
      typeof nestedError === "object" &&
      "code" in nestedError &&
      typeof (nestedError as { code: unknown }).code === "string"
    ) {
      serverErrorCode = (nestedError as { code: string }).code;
    }

    const nestedMessage =
      nestedError &&
      typeof nestedError === "object" &&
      "message" in nestedError &&
      typeof (nestedError as { message: unknown }).message === "string"
        ? (nestedError as { message: string }).message
        : undefined;

    const flatMessage =
      typeof body.message === "string" ? body.message : undefined;

    const detail =
      nestedMessage ??
      flatMessage ??
      (serverErrorCode ? `code=${serverErrorCode}` : null);

    const message = [
      fallbackMessage,
      `HTTP ${res.status}`,
      requestId ? `requestId=${requestId}` : null,
      detail ? `detail=${detail}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    throw new MapDyoaServerRequestFailedError({
      message,
      status: res.status,
      requestId,
      url: res.url,
      body,
      serverErrorCode,
    });
  }
  return data as T
}
