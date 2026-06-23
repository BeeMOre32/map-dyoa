import type { Hoi4GermanExamConfig } from '@/config/hoi4GermanExam2026';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';
import {
  examEventDayEnd,
  formatKstDateLabel,
  formatKstTimeLabel,
  isValidDate,
  kstDateKey,
  toValidDate,
} from '@/lib/hoi4-exam-time';

export type Hoi4GermanExamBinding = {
  schedule: FlattenedSchedule | null;
  /** DB 일정 id — Hoi4ExamState / Hoi4ExamEntry PK */
  examId: string | null;
  /** 예전 날짜 키(yyyy-MM-dd) 마이그레이션 조회용 */
  legacyExamId: string | null;
  scheduledStart: Date | null;
};

function hasValidStartTime(schedule: FlattenedSchedule): boolean {
  return isValidDate(schedule.startTime);
}

function getScheduleStart(schedule: FlattenedSchedule): Date | null {
  return toValidDate(schedule.startTime);
}

function matchesExamScheduleTitle(
  schedule: FlattenedSchedule,
  keywords: readonly string[],
): boolean {
  if (keywords.length === 0 || !hasValidStartTime(schedule)) return false;
  return keywords.some((keyword) => schedule.title.includes(keyword));
}

/** 출발~종료(24h) 구간에 있는 일정 — 본편(늦은 출발) 우선 */
function pickInEventWindow(
  pool: FlattenedSchedule[],
  now: Date,
): FlattenedSchedule | null {
  const nowMs = now.getTime();
  const active = pool.filter((schedule) => {
    const start = getScheduleStart(schedule);
    if (!start) return false;
    const startMs = start.getTime();
    const endMs = examEventDayEnd(start).getTime();
    return nowMs >= startMs && nowMs < endMs;
  });
  if (active.length === 0) return null;
  return active.sort(
    (a, b) =>
      (getScheduleStart(b)?.getTime() ?? -Infinity) -
      (getScheduleStart(a)?.getTime() ?? -Infinity),
  )[0];
}

/**
 * DB 캘린더에서 호이고사 일정·examId·출발 시각 결정
 * 우선순위: 진행 중(출발~24h) → 가장 가까운 미래 출발 → 최근 지난 일정
 */
export function resolveHoi4GermanExamBinding(
  schedules: FlattenedSchedule[],
  config: Hoi4GermanExamConfig,
  now = new Date(),
): Hoi4GermanExamBinding {
  const keywords = config.scheduleTitleIncludes;
  const candidates = schedules.filter((schedule) =>
    matchesExamScheduleTitle(schedule, keywords),
  );

  if (candidates.length === 0) {
    return {
      schedule: null,
      examId: null,
      legacyExamId: null,
      scheduledStart: null,
    };
  }

  const hoi4Linked = candidates.filter((schedule) => schedule.game?.isHoi4);
  const pool = hoi4Linked.length > 0 ? hoi4Linked : candidates;

  const inWindow = pickInEventWindow(pool, now);
  if (inWindow) {
    return toBinding(inWindow);
  }

  const upcoming = pool
    .filter((schedule) => {
      const start = getScheduleStart(schedule);
      return start ? start.getTime() > now.getTime() : false;
    })
    .sort(
      (a, b) =>
        (getScheduleStart(a)?.getTime() ?? Infinity) -
        (getScheduleStart(b)?.getTime() ?? Infinity),
    );
  if (upcoming.length > 0) {
    return toBinding(upcoming[0]);
  }

  const latestPast = pool.sort(
    (a, b) =>
      (getScheduleStart(b)?.getTime() ?? -Infinity) -
      (getScheduleStart(a)?.getTime() ?? -Infinity),
  )[0];
  return toBinding(latestPast);
}

function toBinding(schedule: FlattenedSchedule): Hoi4GermanExamBinding {
  const scheduledStart = getScheduleStart(schedule);
  if (!scheduledStart) {
    return {
      schedule: null,
      examId: null,
      legacyExamId: null,
      scheduledStart: null,
    };
  }

  return {
    schedule,
    examId: schedule.id,
    legacyExamId: kstDateKey(schedule.startTime),
    scheduledStart,
  };
}

export function formatExamScheduleSummary(binding: Hoi4GermanExamBinding): string {
  if (!binding.schedule || !binding.scheduledStart) {
    return '캘린더 호이고사 일정 연동 · 독일 고정 소련 STOP 타임어택';
  }
  const date = formatKstDateLabel(binding.scheduledStart);
  const time = formatKstTimeLabel(binding.scheduledStart);
  return `${time} 출발 · ${date} · ${binding.schedule.title}`;
}
