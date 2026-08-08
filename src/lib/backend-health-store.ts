import { getPrisma } from '@/lib/prisma';
import type { BackendHealthDayStatus } from '@prisma/client';
import {
  BACKEND_HEALTH_ALERT_COOLDOWN_MS,
  BACKEND_HEALTH_ALERT_STREAK,
  BACKEND_HEALTH_FEATURES,
  BACKEND_HEALTH_FEATURE_LABEL,
  BACKEND_HEALTH_HEATMAP_DAYS,
  BACKEND_HEALTH_SAMPLE_RETENTION_DAYS,
  BACKEND_HEALTH_UPTIME_DAYS,
  computeDayStatus,
  kstDayBounds,
  listKstDateKeysEndingToday,
  probeAllBackendHealthFeatures,
  summarizeUptime,
  toKstDateKey,
  type BackendHealthFeature,
  type BackendHealthProbeResult,
  type BackendHealthUptimeSummary,
} from '@/lib/backend-health';

export type BackendHealthDayRow = {
  dateKst: string;
  feature: string;
  totalChecks: number;
  okChecks: number;
  avgLatencyMs: number | null;
  maxLatencyMs: number | null;
  status: BackendHealthDayStatus;
};

export type BackendHealthHeatmapDay = {
  dateKst: string;
  totalChecks: number;
  okChecks: number;
  avgLatencyMs: number | null;
  maxLatencyMs: number | null;
  status: BackendHealthDayStatus;
  hasData: boolean;
};

export type BackendHealthFeatureHeatmapRow = {
  feature: BackendHealthFeature;
  label: string;
  days: BackendHealthHeatmapDay[];
  latestStatus: BackendHealthDayStatus | null;
};

export async function recordBackendHealthProbe(
  probe: BackendHealthProbeResult,
): Promise<void> {
  const prisma = getPrisma();
  await prisma.backendHealthCheck.create({
    data: {
      feature: probe.feature,
      checkedAt: new Date(probe.fetchedAt),
      ok: probe.ok,
      statusCode: probe.statusCode,
      latencyMs: probe.latencyMs,
      error: probe.error,
    },
  });
}

export async function rollupBackendHealthDay(
  dateKey: string,
  feature: BackendHealthFeature,
): Promise<BackendHealthDayRow> {
  const prisma = getPrisma();
  const { start, end } = kstDayBounds(dateKey);

  const samples = await prisma.backendHealthCheck.findMany({
    where: {
      feature,
      checkedAt: { gte: start, lt: end },
    },
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
    where: {
      dateKst_feature: { dateKst: dateKey, feature },
    },
    create: {
      dateKst: dateKey,
      feature,
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
  const [samples, days] = await Promise.all([
    prisma.backendHealthCheck.deleteMany({
      where: { checkedAt: { lt: cutoff } },
    }),
    prisma.backendHealthDay.deleteMany({
      where: { dateKst: { lt: toKstDateKey(cutoff) } },
    }),
  ]);
  return samples.count + days.count;
}

export async function maybeCreateBackendHealthAlert(
  feature: BackendHealthFeature,
): Promise<boolean> {
  const prisma = getPrisma();
  const recent = await prisma.backendHealthCheck.findMany({
    where: { feature },
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
      entity: `backend_health:${feature}`,
      createdAt: { gte: since },
    },
    select: { id: true },
  });
  if (existing) return false;

  await prisma.auditLog.create({
    data: {
      action: 'backend_health_alert',
      entity: `backend_health:${feature}`,
      summary: `${BACKEND_HEALTH_FEATURE_LABEL[feature]} 헬스 체크 ${BACKEND_HEALTH_ALERT_STREAK}회 연속 실패`,
      changes: { feature, samples: recent },
      actorRole: 'system',
    },
  });

  return true;
}

export async function runBackendHealthCron(): Promise<{
  probes: BackendHealthProbeResult[];
  dateKst: string;
  rollups: BackendHealthDayRow[];
  purged: number;
  alertCreated: boolean;
}> {
  const probes = await probeAllBackendHealthFeatures();
  await Promise.all(probes.map((p) => recordBackendHealthProbe(p)));

  const dateKst = toKstDateKey(new Date(probes[0]?.fetchedAt ?? Date.now()));
  const rollups = await Promise.all(
    BACKEND_HEALTH_FEATURES.map((feature) => rollupBackendHealthDay(dateKst, feature)),
  );
  const purged = await purgeOldBackendHealthSamples();

  let alertCreated = false;
  for (const probe of probes) {
    if (probe.ok) continue;
    if (await maybeCreateBackendHealthAlert(probe.feature)) {
      alertCreated = true;
    }
  }

  return { probes, dateKst, rollups, purged, alertCreated };
}

export async function getBackendHealthFeatureHeatmap(
  days = BACKEND_HEALTH_HEATMAP_DAYS,
): Promise<BackendHealthFeatureHeatmapRow[]> {
  const prisma = getPrisma();
  const keys = listKstDateKeysEndingToday(days);
  const rows = await prisma.backendHealthDay.findMany({
    where: {
      dateKst: { in: keys },
      feature: { in: [...BACKEND_HEALTH_FEATURES] },
    },
  });

  return BACKEND_HEALTH_FEATURES.map((feature) => {
    const byKey = new Map(
      rows.filter((r) => r.feature === feature).map((r) => [r.dateKst, r]),
    );
    const dayRows: BackendHealthHeatmapDay[] = keys.map((dateKst) => {
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
      return {
        dateKst: row.dateKst,
        totalChecks: row.totalChecks,
        okChecks: row.okChecks,
        avgLatencyMs: row.avgLatencyMs,
        maxLatencyMs: row.maxLatencyMs,
        status: row.status,
        hasData: true,
      };
    });

    const withData = [...dayRows].reverse().find((d) => d.hasData);
    return {
      feature,
      label: BACKEND_HEALTH_FEATURE_LABEL[feature],
      days: dayRows,
      latestStatus: withData?.status ?? null,
    };
  });
}

/** @deprecated feature 히트맵 사용 */
export async function getBackendHealthHeatmap(
  days = BACKEND_HEALTH_HEATMAP_DAYS,
): Promise<BackendHealthHeatmapDay[]> {
  const rows = await getBackendHealthFeatureHeatmap(days);
  const live = rows.find((r) => r.feature === 'live');
  return live?.days ?? [];
}

export async function getBackendHealthUptimeSummary(
  days = BACKEND_HEALTH_UPTIME_DAYS,
): Promise<BackendHealthUptimeSummary> {
  const prisma = getPrisma();
  const keys = listKstDateKeysEndingToday(days);
  const rows = await prisma.backendHealthDay.findMany({
    where: {
      dateKst: { in: keys },
      feature: { in: [...BACKEND_HEALTH_FEATURES] },
    },
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

  const feature =
    typeof alert.entity === 'string' && alert.entity.startsWith('backend_health:')
      ? alert.entity.slice('backend_health:'.length)
      : 'live';

  const latest = await prisma.backendHealthCheck.findFirst({
    where: { feature },
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
