import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isValid,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';

export const CALENDAR_PREFERENCES_KEY = 'calendar:view-preferences:v1';

export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export type CalendarViewMode = 'weekly' | 'monthly';

export type CalendarSlideDirection = 'left' | 'right';

export function formatWeekRangeLabel(start: Date, end: Date): string {
  const sameYear = format(start, 'yyyy') === format(end, 'yyyy');
  const sameMonth =
    sameYear && format(start, 'yyyy-MM') === format(end, 'yyyy-MM');

  if (sameMonth) {
    return `${format(start, 'M월 d일', { locale: ko })} – ${format(end, 'd일', { locale: ko })}`;
  }
  if (sameYear) {
    return `${format(start, 'M월 d일', { locale: ko })} – ${format(end, 'M월 d일', { locale: ko })}`;
  }
  return `${format(start, 'yyyy년 M월 d일', { locale: ko })} – ${format(end, 'yyyy년 M월 d일', { locale: ko })}`;
}

export function getWeekdayNameColor(
  dayIdx: number,
  variant: 'mobile' | 'desktop',
): string {
  if (dayIdx === 0) {
    return variant === 'mobile'
      ? 'text-red-500 dark:text-red-400'
      : 'text-red-400';
  }
  if (dayIdx === 6) {
    return variant === 'mobile'
      ? 'text-blue-500 dark:text-blue-400'
      : 'text-blue-500';
  }
  return variant === 'mobile'
    ? 'text-slate-500 dark:text-slate-400'
    : 'text-slate-400 dark:text-slate-500';
}

export function buildCalendarDays(
  currentDate: Date,
  viewMode: CalendarViewMode,
): Date[] {
  if (viewMode === 'monthly') {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const daysList: Date[] = [];
    let day = startDate;
    while (day <= endDate) {
      daysList.push(day);
      day = addDays(day, 1);
    }
    return daysList;
  }

  const startDate = startOfWeek(currentDate);
  return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
}

export function shiftCalendarPeriod(
  currentDate: Date,
  viewMode: CalendarViewMode,
  direction: CalendarSlideDirection,
): Date {
  if (viewMode === 'monthly') {
    return direction === 'left'
      ? addMonths(currentDate, 1)
      : subMonths(currentDate, 1);
  }
  return direction === 'left'
    ? addWeeks(currentDate, 1)
    : subWeeks(currentDate, 1);
}

type BuildSchedulesByDateOptions = {
  schedules: FlattenedSchedule[];
  hideEnded: boolean;
  favoritesOnly: boolean;
  favoriteIds: Set<string>;
  selectedStreamers: Set<string>;
  selectedGames: Set<string>;
};

export function buildSchedulesByDate({
  schedules,
  hideEnded,
  favoritesOnly,
  favoriteIds,
  selectedStreamers,
  selectedGames,
}: BuildSchedulesByDateOptions): Map<string, FlattenedSchedule[]> {
  let filtered = schedules;

  if (hideEnded) {
    filtered = filtered.filter((s) => !s.isLiveEnded);
  }

  if (favoritesOnly && favoriteIds.size > 0) {
    filtered = filtered.filter((s) =>
      s.participants.some((p) => favoriteIds.has(p.id)),
    );
  } else if (selectedStreamers.size > 0) {
    filtered = filtered.filter((s) =>
      s.participants.some((p) => selectedStreamers.has(p.id)),
    );
  }

  if (selectedGames.size > 0) {
    filtered = filtered.filter(
      (s) => s.gameId != null && selectedGames.has(s.gameId),
    );
  }

  const map = new Map<string, FlattenedSchedule[]>();
  filtered.forEach((schedule) => {
    const st = new Date(schedule.startTime);
    if (!isValid(st)) return;
    const dateKey = format(st, 'yyyy-MM-dd');
    if (!map.has(dateKey)) map.set(dateKey, []);
    map.get(dateKey)!.push(schedule);
  });
  return map;
}

export function countSchedulesInPeriod(
  schedules: FlattenedSchedule[],
  days: Date[],
  hideEnded: boolean,
): number {
  let filtered = schedules;
  if (hideEnded) {
    filtered = filtered.filter((s) => !s.isLiveEnded);
  }
  let count = 0;
  for (const day of days) {
    const dateKey = format(day, 'yyyy-MM-dd');
    count += filtered.filter((s) => {
      const st = new Date(s.startTime);
      return isValid(st) && format(st, 'yyyy-MM-dd') === dateKey;
    }).length;
  }
  return count;
}

export function countVisibleSchedules(
  schedulesByDate: Map<string, FlattenedSchedule[]>,
): number {
  let count = 0;
  schedulesByDate.forEach((arr) => {
    count += arr.length;
  });
  return count;
}
