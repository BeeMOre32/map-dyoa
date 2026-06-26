import { getPrisma } from '@/lib/prisma';
import type { BackendHealthDayStatus } from '@prisma/client';
import {
  BACKEND_HEALTH_ALERT_COOLDOWN_MS,
  BACKEND_HEALTH_ALERT_STREAK,
  BACKEND_HEALTH_HEATMAP_DAYS,
  BACKEND_HEALTH_SAMPLE_RETENTION_DAYS,
  BACKEND_HEALTH_UPTIME_DAYS,
  computeDayStatus,
  kstDayBounds,
  listKstDateKeysEndingToday,
  probeBackendHealth,
  summarizeUptime,
  toKstDateKey,
  type BackendHealthProbeResult,
  type BackendHealthUptimeSummary,
} from '@/lib/backend-health';

export type BackendHealthDayRow = {
  dateKst: string;
  totalChecks: number;
  okChecks: number;
  avgLatencyMs: number | null;
  maxLatencyMs: number | null;
  status: BackendHealthDayStatus;
};

export type BackendHealthHeatmapDay = BackendHealthDayRow & {
  hasData: boolean;
};

export async function recordBackendHealthProbe(
  probe: BackendHealthProbeResult,
): Promise<void> {
  const prisma = getPrisma();
  await prisma.backendHealthCheck.create({
    data: {
      checkedAt: new Date(probe.fetchedAt),
      ok: probe.ok,
      statusCode: probe.statusCode,
      latencyMs: probe.latencyMs,
      error: probe.error,
    },
  });
}

export async function rollupBackendHealthDay(dateKey: string): Promise<BackendHealthDayRow> {
  const prisma = getPrisma();
  const { start, end } = kstDayBounds(dateKey);

  const samples = await prisma.backendHealthCheck.findMany({
    where: { checkedAt: { gte: start, lt: end } },
    select: { ok: true, latencyMs: true },
  });

  const totalChecks = samples.length;
  const okChecks = samples.filter((s) => s.ok).length;
  const latencies = samples
    .map((s) => s.latencyMs)
    .filter((ms): ms is number => typeof ms === 'number');
  const avgLatencyMs =
    latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : null;
  const maxLatencyMs = latencies.length > 0 ? Math.max(...latencies) : null;
  const status = computeDayStatus(totalChecks, okChecks, avgLatencyMs);

  const row = await prisma.backendHealthDay.upsert({
    where: { dateKst: dateKey },
    create: {
      dateKst: dateKey,
      totalChecks,
      okChecks,
      avgLatencyMs,
      maxLatencyMs,
      status,
    },
    update: {
      totalChecks,
      okChecks,
      avgLatencyMs,
      maxLatencyMs,
      status,
    },
  });

  return row;
}

export async function purgeOldBackendHealthSamples(): Promise<number> {
  const prisma = getPrisma();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - BACKEND_HEALTH_SAMPLE_RETENTION_DAYS);
  const result = await prisma.backendHealthCheck.deleteMany({
    where: { checkedAt: { lt: cutoff } },
  });
  return result.count;
}

export async function maybeCreateBackendHealthAlert(): Promise<boolean> {
  const prisma = getPrisma();
  const recent = await prisma.backendHealthCheck.findMany({
    orderBy: { checkedAt: 'desc' },
    take: BACKEND_HEALTH_ALERT_STREAK,
    select: { ok: true, checkedAt: true, error: true, statusCode: true },
  });

  if (recent.length < BACKEND_HEALTH_ALERT_STREAK) return false;
  if (recent.some((r) => r.ok)) return false;

  const since = new Date(Date.now() - BACKEND_HEALTH_ALERT_COOLDOWN_MS);
  const existing = await prisma.auditLog.findFirst({
    where: {
      action: 'backend_health_alert',
      createdAt: { gte: since },
    },
    select: { id: true },
  });
  if (existing) return false;

  await prisma.auditLog.create({
    data: {
      action: 'backend_health_alert',
      entity: 'backend_health',
      summary: '백엔드 헬스 체크 3회 연속 실패',
      changes: { samples: recent },
      actorRole: 'system',
    },
  });

  return true;
}

export async function runBackendHealthCron(): Promise<{
  probe: BackendHealthProbeResult;
  dateKst: string;
  rollup: BackendHealthDayRow;
  purged: number;
  alertCreated: boolean;
}> {
  const probe = await probeBackendHealth();
  await recordBackendHealthProbe(probe);

  const dateKst = toKstDateKey(new Date(probe.fetchedAt));
  const rollup = await rollupBackendHealthDay(dateKst);
  const purged = await purgeOldBackendHealthSamples();
  const alertCreated = probe.ok ? false : await maybeCreateBackendHealthAlert();

  return { probe, dateKst, rollup, purged, alertCreated };
}

export async function getBackendHealthHeatmap(
  days = BACKEND_HEALTH_HEATMAP_DAYS,
): Promise<BackendHealthHeatmapDay[]> {
  const prisma = getPrisma();
  const keys = listKstDateKeysEndingToday(days);
  const rows = await prisma.backendHealthDay.findMany({
    where: { dateKst: { in: keys } },
  });
  const byKey = new Map(rows.map((r) => [r.dateKst, r]));

  return keys.map((dateKst) => {
    const row = byKey.get(dateKst);
    if (!row) {
      return {
        dateKst,
        totalChecks: 0,
        okChecks: 0,
        avgLatencyMs: null,
        maxLatencyMs: null,
        status: 'OK' as BackendHealthDayStatus,
        hasData: false,
      };
    }
    return { ...row, hasData: true };
  });
}

export async function getBackendHealthUptimeSummary(
  days = BACKEND_HEALTH_UPTIME_DAYS,
): Promise<BackendHealthUptimeSummary> {
  const prisma = getPrisma();
  const keys = listKstDateKeysEndingToday(days);
  const rows = await prisma.backendHealthDay.findMany({
    where: { dateKst: { in: keys } },
    select: { totalChecks: true, okChecks: true, status: true },
  });
  return summarizeUptime(rows, days);
}

export async function getRecentBackendHealthAlerts(limit = 5) {
  const prisma = getPrisma();
  return prisma.auditLog.findMany({
    where: { action: 'backend_health_alert' },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function hasUnresolvedBackendHealthAlert(): Promise<boolean> {
  const prisma = getPrisma();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const alert = await prisma.auditLog.findFirst({
    where: {
      action: 'backend_health_alert',
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!alert) return false;

  const latest = await prisma.backendHealthCheck.findFirst({
    orderBy: { checkedAt: 'desc' },
    select: { ok: true, checkedAt: true },
  });
  if (!latest) return true;
  return !latest.ok || latest.checkedAt < alert.createdAt;
}

export type BackendHealthCollectionMeta = {
  lastCronAt: Date | null;
  lastCronOk: boolean | null;
  collectionStartedAt: Date | null;
  totalSamples: number;
};

export async function getBackendHealthCollectionMeta(): Promise<BackendHealthCollectionMeta | null> {
  try {
    const prisma = getPrisma();
    const [latest, earliest, totalSamples] = await Promise.all([
      prisma.backendHealthCheck.findFirst({
        orderBy: { checkedAt: 'desc' },
        select: { checkedAt: true, ok: true },
      }),
      prisma.backendHealthCheck.findFirst({
        orderBy: { checkedAt: 'asc' },
        select: { checkedAt: true },
      }),
      prisma.backendHealthCheck.count(),
    ]);
    return {
      lastCronAt: latest?.checkedAt ?? null,
      lastCronOk: latest?.ok ?? null,
      collectionStartedAt: earliest?.checkedAt ?? null,
      totalSamples,
    };
  } catch {
    return null;
  }
}
