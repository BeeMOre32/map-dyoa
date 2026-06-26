/** map-dyoa-server 헬스 프로브·KST 날짜·일별 상태 판정 */

export type HealthPayload = {
  ok?: boolean;
  db?: string;
  status?: string;
  service?: string;
};

export type BackendHealthProbeResult = {
  healthUrl: string;
  latencyMs: number | null;
  statusCode: number | null;
  ok: boolean;
  payload: HealthPayload | null;
  fetchedAt: string;
  error: string | null;
};

export type BackendHealthDayStatus = 'OK' | 'DEGRADED' | 'DOWN';

export const BACKEND_HEALTH_SAMPLE_RETENTION_DAYS = 90;
export const BACKEND_HEALTH_HEATMAP_DAYS = 30;
export const BACKEND_HEALTH_UPTIME_DAYS = 7;
export const BACKEND_HEALTH_ALERT_STREAK = 3;
export const BACKEND_HEALTH_ALERT_COOLDOWN_MS = 60 * 60 * 1000;

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function getBackendHealthUrl(): string {
  return (
    process.env.BACKEND_HEALTH_URL ??
    process.env.NEXT_PUBLIC_BACKEND_HEALTH_URL ??
    'https://map-dyoa-server.fly.dev'
  );
}

export async function probeBackendHealth(): Promise<BackendHealthProbeResult> {
  const healthUrl = getBackendHealthUrl();
  const start = Date.now();

  try {
    const response = await fetch(healthUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    const latencyMs = Date.now() - start;

    let payload: HealthPayload | null = null;
    try {
      payload = (await response.json()) as HealthPayload;
    } catch {
      payload = null;
    }

    const bodyOk = payload?.ok !== false;
    const ok = response.ok && bodyOk;

    return {
      healthUrl,
      latencyMs,
      statusCode: response.status,
      ok,
      payload,
      fetchedAt: new Date().toISOString(),
      error: null,
    };
  } catch (error) {
    return {
      healthUrl,
      latencyMs: null,
      statusCode: null,
      ok: false,
      payload: null,
      fetchedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'health check 실패',
    };
  }
}

/** UTC 시각 → KST 달력 날짜 (YYYY-MM-DD) */
export function toKstDateKey(date: Date): string {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** KST 날짜 키의 UTC 구간 [start, end) */
export function kstDayBounds(dateKey: string): { start: Date; end: Date } {
  const [y, m, d] = dateKey.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - KST_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export function listKstDateKeysEndingToday(count: number, now = new Date()): string[] {
  const todayKey = toKstDateKey(now);
  const { start: todayStartUtc } = kstDayBounds(todayKey);
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const instant = new Date(todayStartUtc.getTime() - i * 24 * 60 * 60 * 1000);
    keys.push(toKstDateKey(instant));
  }
  return keys;
}

export function computeDayStatus(
  totalChecks: number,
  okChecks: number,
  avgLatencyMs: number | null,
): BackendHealthDayStatus {
  if (totalChecks <= 0) return 'DOWN';
  const failRate = (totalChecks - okChecks) / totalChecks;
  if (failRate > 0.05) return 'DOWN';
  if (failRate > 0 || (avgLatencyMs ?? 0) > 2000) return 'DEGRADED';
  return 'OK';
}

export function formatUptimePercent(okChecks: number, totalChecks: number): number | null {
  if (totalChecks <= 0) return null;
  return Math.round((okChecks / totalChecks) * 1000) / 10;
}

export type BackendHealthUptimeSummary = {
  days: number;
  totalChecks: number;
  okChecks: number;
  uptimePercent: number | null;
  status: 'ok' | 'degraded' | 'down' | 'unknown';
};

export function summarizeUptime(
  rows: { totalChecks: number; okChecks: number; status: BackendHealthDayStatus }[],
  days: number,
): BackendHealthUptimeSummary {
  const totalChecks = rows.reduce((s, r) => s + r.totalChecks, 0);
  const okChecks = rows.reduce((s, r) => s + r.okChecks, 0);
  const uptimePercent = formatUptimePercent(okChecks, totalChecks);

  let status: BackendHealthUptimeSummary['status'] = 'unknown';
  if (totalChecks > 0) {
    if (rows.some((r) => r.status === 'DOWN')) status = 'down';
    else if (rows.some((r) => r.status === 'DEGRADED')) status = 'degraded';
    else status = 'ok';
  }

  return { days, totalChecks, okChecks, uptimePercent, status };
}

export const DAY_STATUS_LABEL: Record<BackendHealthDayStatus, string> = {
  OK: '정상',
  DEGRADED: '저하',
  DOWN: '장애',
};

export const DAY_STATUS_CLASS: Record<BackendHealthDayStatus, string> = {
  OK: 'bg-emerald-500 hover:bg-emerald-400',
  DEGRADED: 'bg-amber-400 hover:bg-amber-300',
  DOWN: 'bg-rose-500 hover:bg-rose-400',
};
