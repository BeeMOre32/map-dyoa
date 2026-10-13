import { kstDayBounds, toKstDateKey } from '@/lib/backend-health';

/** 자정을 넘긴 같은 방송의 시작일(KST). 오늘 시작한 방송이면 null. */
export function overnightStartKey(liveStart: Date | null, todayKst: string): string | null {
  if (!liveStart || !Number.isFinite(liveStart.getTime())) return null;
  const startKey = toKstDateKey(liveStart);
  return startKey < todayKst ? startKey : null;
}

export function previousKstDateKey(dateKst: string): string {
  const { start } = kstDayBounds(dateKst);
  return toKstDateKey(new Date(start.getTime() - 60_000));
}
