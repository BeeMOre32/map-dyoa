import { isValid } from 'date-fns';
import { kstDateKey } from '@/lib/hoi4-exam-time';

export type ScheduleLiveContext = {
  startTime: Date | string;
  isGuerrilla?: boolean;
  isLiveEnded?: boolean;
  participants: { id: string }[];
};

function isTodayKst(date: Date, now: Date): boolean {
  const key = kstDateKey(date);
  return key !== '' && key === kstDateKey(now);
}

/** 등록된 시작 시각 이전이면 false (시간 미정 일정은 항상 true) */
export function hasScheduleBroadcastStarted(
  schedule: Pick<ScheduleLiveContext, 'startTime' | 'isGuerrilla'>,
  now: Date = new Date(),
): boolean {
  if (schedule.isGuerrilla) return true;
  const start = new Date(schedule.startTime);
  if (!isValid(start)) return true;
  return now.getTime() >= start.getTime();
}

/** 캘린더 카드 LIVE 뱃지 — 치지직 라이브 + 오늘(KST) 일정 + 시작 시각 이후 */
export function isScheduleLiveOnCard(
  schedule: ScheduleLiveContext,
  liveStreamerIds: Set<string> | undefined,
  now: Date = new Date(),
): boolean {
  if (schedule.isLiveEnded || !liveStreamerIds?.size) return false;
  if (!hasScheduleBroadcastStarted(schedule, now)) return false;

  const start = new Date(schedule.startTime);
  if (isValid(start) && !isTodayKst(start, now)) return false;

  return schedule.participants.some((p) => liveStreamerIds.has(p.id));
}

/** 상세 모달용 — 현재 라이브 중인 참가자 (카드 LIVE 조건과 동일) */
export function getScheduleLiveParticipants<T extends { id: string }>(
  schedule: ScheduleLiveContext & { participants: T[] },
  liveStreamerIds: Set<string> | undefined,
  now: Date = new Date(),
): T[] {
  if (!isScheduleLiveOnCard(schedule, liveStreamerIds, now) || !liveStreamerIds) {
    return [];
  }
  return schedule.participants.filter((p): p is T => liveStreamerIds.has(p.id));
}

export function isChzzkLiveUrl(url: string): boolean {
  return url.includes('chzzk.naver.com');
}

/** 시작 전에는 치지직(라이브) 링크만 숨김 */
export function filterScheduleLiveUrls(
  urls: string[],
  schedule: Pick<ScheduleLiveContext, 'startTime' | 'isGuerrilla'>,
  now: Date = new Date(),
): string[] {
  if (hasScheduleBroadcastStarted(schedule, now)) return urls;
  return urls.filter((url) => !isChzzkLiveUrl(url));
}
