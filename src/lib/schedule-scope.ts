import type { FlattenedSchedule } from '@/lib/schedule-formatters';

export type ScheduleScope = 'major' | 'personal' | 'both';

const SCOPE_KEY = 'calendar:schedule-kind:v1';

export function isScheduleScope(value: unknown): value is ScheduleScope {
  return value === 'major' || value === 'personal' || value === 'both';
}

export function readScheduleScope(): ScheduleScope {
  try {
    const stored = localStorage.getItem(SCOPE_KEY);
    return isScheduleScope(stored) ? stored : 'both';
  } catch {
    return 'both';
  }
}

export function writeScheduleScope(scope: ScheduleScope) {
  try {
    localStorage.setItem(SCOPE_KEY, scope);
    localStorage.removeItem('calendar:personal-schedules:v1');
    localStorage.removeItem('calendar:schedule-scope:v1');
  } catch {
    /* 보기 전환은 이번 방문에서만 유지된다 */
  }
}

/** 게스트를 뺀 참여자가 한 명이면 스트리머 개인 방송이다. */
export function isStreamerPersonalSchedule(schedule: FlattenedSchedule): boolean {
  return schedule.participants.filter((person) => !person.isGuest).length === 1;
}

export function filterSchedulesByScope(
  schedulesByDate: Map<string, FlattenedSchedule[]>,
  scope: ScheduleScope,
): Map<string, FlattenedSchedule[]> {
  if (scope === 'both') return schedulesByDate;
  const next = new Map<string, FlattenedSchedule[]>();
  for (const [key, rows] of schedulesByDate) {
    const kept = rows.filter((row) =>
      scope === 'personal'
        ? isStreamerPersonalSchedule(row)
        : !isStreamerPersonalSchedule(row),
    );
    if (kept.length > 0) next.set(key, kept);
  }
  return next;
}

export function liveRowMatchesScope(collab: boolean, scope: ScheduleScope): boolean {
  if (scope === 'both') return true;
  return scope === 'personal' ? !collab : collab;
}
