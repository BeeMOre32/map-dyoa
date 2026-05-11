/** map-dyoa-server로 나가는 fetch 공통 (순환 import 없음) */

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
    try {
      const res = await fetch(url, init)
      if (RETRYABLE_HTTP.has(res.status) && attempt < maxRetries) {
        await sleep(baseDelayMs * 2 ** attempt)
        continue
      }
      return res
    } catch (e) {
      lastError = e
      if (!isRetryableFetchError(e) || attempt >= maxRetries) {
        throw e
      }
      await sleep(baseDelayMs * 2 ** attempt)
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
    const message =
      typeof (data as { message?: unknown }).message === 'string'
        ? (data as { message: string }).message
        : fallbackMessage
    throw new Error(message)
  }
  return data as T
}
