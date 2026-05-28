/** 일정 수정 충돌(낙관적 동시성) 메시지 */
export const SCHEDULE_CONFLICT_MESSAGE =
  '다른 관리자가 먼저 수정했습니다. 새로고침 후 다시 시도해주세요.';

export function scheduleRevisionMs(
  value: Date | string | undefined | null,
): number | null {
  if (value == null) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/** revision 토큰(보통 updatedAt, 없으면 createdAt) */
export function pickScheduleRevision(
  schedule: { updatedAt?: Date | string | null; createdAt?: Date | string | null },
): Date | null {
  const raw = schedule.updatedAt ?? schedule.createdAt;
  if (raw == null) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function scheduleRevisionsMatch(
  expected: Date | string | undefined | null,
  actual: Date | string | undefined | null,
): boolean {
  const ems = scheduleRevisionMs(expected);
  const ams = scheduleRevisionMs(actual);
  if (ems == null) return true;
  if (ams == null) return false;
  return ems === ams;
}
