import { getPrisma } from '@/lib/prisma';
import { toKstDateKey } from '@/lib/backend-health';

/** 변경 이력·일정 후보 큐 보관 일수. 넘으면 삭제 */
export const APP_DATA_RETENTION_DAYS = 14;

export function appDataRetentionCutoff(now = new Date()): Date {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - APP_DATA_RETENTION_DAYS);
  return cutoff;
}

export type AppDataPurgeResult = {
  auditLogs: number;
  candidates: number;
  cutoffIso: string;
  cutoffDateKst: string;
};

/** 2주를 넘긴 AuditLog·ScheduleCandidate 삭제 */
export async function purgeExpiredAppRecords(
  now = new Date(),
): Promise<AppDataPurgeResult> {
  const prisma = getPrisma();
  const cutoff = appDataRetentionCutoff(now);
  const cutoffDateKst = toKstDateKey(cutoff);

  const [audit, candidates] = await Promise.all([
    prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    }),
    prisma.scheduleCandidate.deleteMany({
      where: {
        OR: [
          { detectedAt: { lt: cutoff } },
          { lastSeenAt: { lt: cutoff } },
          { dateKst: { lt: cutoffDateKst } },
        ],
      },
    }),
  ]);

  return {
    auditLogs: audit.count,
    candidates: candidates.count,
    cutoffIso: cutoff.toISOString(),
    cutoffDateKst,
  };
}
