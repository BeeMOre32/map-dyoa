import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  BONGNUDO2_CLOSE_HOUR,
  BONGNUDO2_END_DATE,
  BONGNUDO2_GUEST_NAMES,
  BONGNUDO2_HOLIDAYS,
  BONGNUDO2_OPEN_HOUR,
  BONGNUDO2_PATH,
  BONGNUDO2_PRE_EVENTS,
  BONGNUDO2_ROSTER_NAMES,
  BONGNUDO2_START_DATE,
  BONGNUDO2_TITLE,
} from '@/config/bongnudo2';
import { extractChzzkChannelId } from '@/lib/chzzk';
import { kstDateKey } from '@/lib/hoi4-exam-time';
import { MAX_STREAMS } from '@/components/multiview/utils';
import type { FlattenedSchedule, ParticipantFlat } from '@/lib/schedule-formatters';
import type { Game, Streamer } from '@prisma/client';
import type { ClipWithParticipants } from '@/types/entities';

const KST = 'Asia/Seoul';
const HOLIDAY_SET = new Set<string>(BONGNUDO2_HOLIDAYS);
const ROSTER_SET = new Set<string>(BONGNUDO2_ROSTER_NAMES);
const GUEST_SET = new Set<string>(BONGNUDO2_GUEST_NAMES);

export type BongnudoRosterSplit = {
  members: Streamer[];
  guests: Streamer[];
  unmatchedMembers: string[];
  unmatchedGuests: string[];
};

function byKoreanName(a: Streamer, b: Streamer) {
  return a.name.localeCompare(b.name, 'ko');
}

export function splitBongnudoStreamers(streamers: Streamer[]): BongnudoRosterSplit {
  const members: Streamer[] = [];
  const guests: Streamer[] = [];

  for (const streamer of streamers) {
    const namedGuest = GUEST_SET.has(streamer.name);
    const namedMember = ROSTER_SET.has(streamer.name);
    if (namedGuest || (namedMember && streamer.isGuest)) {
      guests.push(streamer);
    } else if (namedMember) {
      members.push(streamer);
    }
  }

  members.sort(byKoreanName);
  guests.sort(byKoreanName);

  const foundMembers = new Set(members.map((s) => s.name));
  const foundGuests = new Set(guests.map((s) => s.name));

  return {
    members,
    guests,
    unmatchedMembers: BONGNUDO2_ROSTER_NAMES.filter((name) => !foundMembers.has(name)),
    unmatchedGuests: BONGNUDO2_GUEST_NAMES.filter((name) => !foundGuests.has(name)),
  };
}

const RELATED_KEYWORD =
  /봉누도|bongnudo|gta\s*5|gta5|\bgta\b|그타|인생모드|rp\s*서버/i;

export type BongnudoPhase =
  | 'upcoming'
  | 'prep'
  | 'holiday'
  | 'offhours'
  | 'live'
  | 'ended';

export type BongnudoWallClock = {
  dateKey: string;
  hour: number;
  minute: number;
};

export type BongnudoDay = {
  dateKey: string;
  month: number;
  day: number;
  weekday: string;
  isHoliday: boolean;
  isToday: boolean;
};

export type BongnudoStatus = {
  phase: BongnudoPhase;
  nowDateKey: string;
  sessionDate: string;
  label: string;
  detail: string;
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function getKstWallClock(now = new Date()): BongnudoWallClock {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: KST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  const rawHour = get('hour');
  const hour = Number(rawHour === '24' ? '0' : rawHour);
  return {
    dateKey: `${get('year')}-${get('month')}-${get('day')}`,
    hour: Number.isFinite(hour) ? hour : 0,
    minute: Number(get('minute') || 0),
  };
}

export function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const utc = Date.UTC(year, month - 1, day + deltaDays);
  const shifted = new Date(utc);
  return `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(shifted.getUTCDate())}`;
}

/** 03:00 이전은 전날 세션(18:00~익일 03:00)에 속함 */
export function getBongnudoSessionDate(now = new Date()): string {
  const wall = getKstWallClock(now);
  if (wall.hour < BONGNUDO2_CLOSE_HOUR) return shiftDateKey(wall.dateKey, -1);
  return wall.dateKey;
}

export function isBongnudoHoliday(dateKey: string): boolean {
  return HOLIDAY_SET.has(dateKey);
}

export function isBongnudoOperatingDay(dateKey: string): boolean {
  return (
    dateKey >= BONGNUDO2_START_DATE &&
    dateKey <= BONGNUDO2_END_DATE &&
    !isBongnudoHoliday(dateKey)
  );
}

function weekdayKo(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'UTC',
    weekday: 'short',
  }).format(utc);
}

export function listBongnudoDays(now = new Date()): BongnudoDay[] {
  const today = getKstWallClock(now).dateKey;
  const days: BongnudoDay[] = [];
  for (
    let cursor = BONGNUDO2_START_DATE;
    cursor <= BONGNUDO2_END_DATE;
    cursor = shiftDateKey(cursor, 1)
  ) {
    const [, month, day] = cursor.split('-').map(Number);
    days.push({
      dateKey: cursor,
      month,
      day,
      weekday: weekdayKo(cursor),
      isHoliday: isBongnudoHoliday(cursor),
      isToday: cursor === today,
    });
  }
  return days;
}

export function getBongnudoStatus(now = new Date()): BongnudoStatus {
  const wall = getKstWallClock(now);
  const sessionDate = getBongnudoSessionDate(now);
  const lastCloseDate = shiftDateKey(BONGNUDO2_END_DATE, 1);

  if (
    wall.dateKey > lastCloseDate ||
    (wall.dateKey === lastCloseDate && wall.hour >= BONGNUDO2_CLOSE_HOUR)
  ) {
    return {
      phase: 'ended',
      nowDateKey: wall.dateKey,
      sessionDate,
      label: '운영 종료',
      detail: '정식 서버 기간이 끝났습니다.',
    };
  }

  const prep = BONGNUDO2_PRE_EVENTS.find((event) => event.date === wall.dateKey);
  if (prep) {
    return {
      phase: 'prep',
      nowDateKey: wall.dateKey,
      sessionDate,
      label: prep.label,
      detail: `${prep.note} · 정식 오픈은 9월 14일 18:00`,
    };
  }

  if (wall.dateKey < BONGNUDO2_START_DATE) {
    return {
      phase: 'upcoming',
      nowDateKey: wall.dateKey,
      sessionDate,
      label: '오픈 예정',
      detail: '2026년 9월 14일(월) 18:00 KST 정식 오픈',
    };
  }

  if (isBongnudoHoliday(sessionDate)) {
    return {
      phase: 'holiday',
      nowDateKey: wall.dateKey,
      sessionDate,
      label: '오늘 휴일',
      detail: '매주 금요일은 서버가 열리지 않습니다.',
    };
  }

  const inHours = wall.hour >= BONGNUDO2_OPEN_HOUR || wall.hour < BONGNUDO2_CLOSE_HOUR;
  if (isBongnudoOperatingDay(sessionDate) && inHours) {
    return {
      phase: 'live',
      nowDateKey: wall.dateKey,
      sessionDate,
      label: '운영 중',
      detail: '오늘 18:00 ~ 익일 03:00 (KST)',
    };
  }

  if (isBongnudoOperatingDay(wall.dateKey) || isBongnudoOperatingDay(sessionDate)) {
    return {
      phase: 'offhours',
      nowDateKey: wall.dateKey,
      sessionDate,
      label: '오늘 휴장 전',
      detail: '오늘 18:00에 서버가 열립니다.',
    };
  }

  return {
    phase: 'upcoming',
    nowDateKey: wall.dateKey,
    sessionDate,
    label: '일정 확인',
    detail: '아래 달력에서 운영일을 확인하세요.',
  };
}

export function isBongnudoPromoActive(now = new Date()): boolean {
  return getBongnudoStatus(now).phase !== 'ended';
}

export function matchBongnudoStreamers(streamers: Streamer[]): Streamer[] {
  return splitBongnudoStreamers(streamers).members;
}

export function matchBongnudoGuests(streamers: Streamer[]): Streamer[] {
  return splitBongnudoStreamers(streamers).guests;
}

export function unmatchedBongnudoNames(streamers: Streamer[]): string[] {
  return splitBongnudoStreamers(streamers).unmatchedMembers;
}

export function isBongnudoRelatedSchedule(
  schedule: FlattenedSchedule,
  rosterIds: Set<string>,
): boolean {
  const blob = `${schedule.title} ${schedule.game?.title ?? ''} ${schedule.content ?? ''}`;
  if (RELATED_KEYWORD.test(blob)) return true;

  const dateKey = kstDateKey(schedule.startTime);
  if (dateKey < BONGNUDO2_START_DATE || dateKey > BONGNUDO2_END_DATE) return false;
  return schedule.participants.some((participant) => rosterIds.has(participant.id));
}

/** unstable_cache·RSC 직렬화 후 startTime이 string일 수 있음 */
function scheduleStartMs(startTime: Date | string): number {
  return new Date(startTime).getTime();
}

export function pickBongnudoSchedules(
  schedules: FlattenedSchedule[],
  rosterIds: Set<string>,
): FlattenedSchedule[] {
  return [...schedules]
    .filter((schedule) => isBongnudoRelatedSchedule(schedule, rosterIds))
    .sort((a, b) => scheduleStartMs(a.startTime) - scheduleStartMs(b.startTime));
}

export const BONGNUDO_HUB_ID_PREFIX = 'bongnudo2:';

export type BongnudoBandRole = 'only' | 'start' | 'middle' | 'end';

export function isBongnudoHubSchedule(schedule: { id: string }): boolean {
  return schedule.id.startsWith(BONGNUDO_HUB_ID_PREFIX);
}

export function isBongnudoKeywordSchedule(schedule: FlattenedSchedule): boolean {
  const blob = `${schedule.title} ${schedule.game?.title ?? ''} ${schedule.content ?? ''}`;
  return RELATED_KEYWORD.test(blob);
}

export function scheduleCardHref(schedule: { id: string }): string {
  return isBongnudoHubSchedule(schedule)
    ? BONGNUDO2_PATH
    : `/calendar/schedule/${schedule.id}`;
}

export function pickBongnudoGame(games: Game[]): Game | null {
  return (
    games.find((game) =>
      /봉누도|bongnudo|gta\s*5|gta5|\bgta\b|그타|인생모드/i.test(game.title),
    ) ?? null
  );
}

function toParticipantFlat(streamer: Streamer): ParticipantFlat {
  return {
    ...streamer,
    nation: null,
    result: null,
    isGuest: streamer.isGuest,
  };
}

function chzzkLiveUrl(chzzkUrl: string | null | undefined): string | null {
  if (!chzzkUrl) return null;
  const channelId = extractChzzkChannelId(chzzkUrl);
  return channelId ? `https://chzzk.naver.com/live/${channelId}` : chzzkUrl;
}

function sessionBounds(dateKey: string): { start: Date; end: Date } {
  const next = shiftDateKey(dateKey, 1);
  return {
    start: new Date(`${dateKey}T${pad2(BONGNUDO2_OPEN_HOUR)}:00:00+09:00`),
    end: new Date(`${next}T${pad2(BONGNUDO2_CLOSE_HOUR)}:00:00+09:00`),
  };
}

export function makeBongnudoHubSchedule(
  dateKey: string,
  related: FlattenedSchedule[],
  roster: Streamer[],
  game: Game | null,
  now = new Date(),
): FlattenedSchedule {
  const { start, end } = sessionBounds(dateKey);
  const participantMap = new Map<string, ParticipantFlat>();
  for (const schedule of related) {
    for (const participant of schedule.participants) {
      participantMap.set(participant.id, participant);
    }
  }
  if (participantMap.size === 0) {
    for (const streamer of roster) {
      participantMap.set(streamer.id, toParticipantFlat(streamer));
    }
  }
  const participants = [...participantMap.values()].sort(
    (a, b) => Number(a.isGuest) - Number(b.isGuest) || a.name.localeCompare(b.name, 'ko'),
  );
  const sourceGame = related.find((schedule) => schedule.game)?.game ?? game;

  return {
    id: `${BONGNUDO_HUB_ID_PREFIX}${dateKey}`,
    title: BONGNUDO2_TITLE,
    content: 'GTA5 RP 서버 · 18:00–익일 03:00 · 참가 인원은 라이브에 맞춤',
    gameId: sourceGame?.id ?? null,
    game: sourceGame,
    isGuerrilla: false,
    isNaeJeon: false,
    isLiveEnded: now.getTime() >= end.getTime(),
    liveUrls: [...new Set(related.flatMap((schedule) => schedule.liveUrls ?? []))],
    startTime: start,
    endTime: end,
    createdAt: related[0]?.createdAt ?? start,
    updatedAt: related[0]?.updatedAt ?? start,
    participants,
    formattedDate: format(start, 'yyyy년 MM월 dd일(EEEE)', { locale: ko }),
    formattedTime: `${pad2(BONGNUDO2_OPEN_HOUR)}:00`,
  };
}

/** 테스트·미리보기용으로 캘린더에 깔 운영일 하나 */
export function nextBongnudoHubDate(now = new Date()): string | null {
  if (getBongnudoStatus(now).phase === 'ended') return null;
  const today = getKstWallClock(now).dateKey;
  const session = getBongnudoSessionDate(now);
  if (isBongnudoOperatingDay(session)) return session;
  const upcoming = listBongnudoDays(now).find(
    (day) => !day.isHoliday && day.dateKey >= today,
  );
  if (upcoming) return upcoming.dateKey;
  return listBongnudoDays(now).find((day) => !day.isHoliday)?.dateKey ?? null;
}

function resolveFillDateKeys(
  fill: 'one' | 'operating' | 'none' | string[],
  now: Date,
): string[] {
  if (fill === 'none') return [];
  if (fill === 'one') {
    const dateKey = nextBongnudoHubDate(now);
    return dateKey ? [dateKey] : [];
  }
  if (fill === 'operating') {
    if (getBongnudoStatus(now).phase === 'ended') return [];
    return listBongnudoDays(now)
      .filter((day) => !day.isHoliday)
      .map((day) => day.dateKey);
  }
  return fill.filter(isBongnudoOperatingDay);
}

/** 키워드 일정은 숨기고, 운영일 허브만 지정한 만큼 깔아 둠 */
export function projectBongnudoSchedules(
  schedules: FlattenedSchedule[],
  roster: Streamer[],
  game: Game | null,
  options?: { fill?: 'one' | 'operating' | 'none' | string[]; now?: Date },
): FlattenedSchedule[] {
  const now = options?.now ?? new Date();
  const rest: FlattenedSchedule[] = [];
  const relatedByDay = new Map<string, FlattenedSchedule[]>();

  for (const schedule of schedules) {
    if (isBongnudoHubSchedule(schedule)) continue;
    if (isBongnudoKeywordSchedule(schedule)) {
      const dateKey = kstDateKey(schedule.startTime);
      if (!dateKey) {
        rest.push(schedule);
        continue;
      }
      const bucket = relatedByDay.get(dateKey) ?? [];
      bucket.push(schedule);
      relatedByDay.set(dateKey, bucket);
      continue;
    }
    rest.push(schedule);
  }

  const daysToShow = new Set(
    resolveFillDateKeys(options?.fill ?? 'one', now),
  );

  const hubs = [...daysToShow]
    .sort()
    .map((dateKey) =>
      makeBongnudoHubSchedule(dateKey, relatedByDay.get(dateKey) ?? [], roster, game, now),
    );

  return [...rest, ...hubs].sort(
    (a, b) => scheduleStartMs(a.startTime) - scheduleStartMs(b.startTime),
  );
}

/** 오늘 세션 카드의 참가 인원만 라이브 멤버로 맞춤 */
export function applyBongnudoLiveOverlay(
  schedules: FlattenedSchedule[],
  roster: Streamer[],
  liveIds: Set<string>,
  now = new Date(),
): FlattenedSchedule[] {
  const sessionDate = getBongnudoSessionDate(now);
  const livePeople = roster.filter((streamer) => liveIds.has(streamer.id));
  if (livePeople.length === 0) return schedules;

  return schedules.map((schedule) => {
    if (!isBongnudoHubSchedule(schedule)) return schedule;
    if (kstDateKey(schedule.startTime) !== sessionDate) return schedule;
    return {
      ...schedule,
      participants: livePeople.map(toParticipantFlat),
      liveUrls: [
        ...new Set(
          livePeople
            .map((streamer) => chzzkLiveUrl(streamer.chzzkUrl))
            .filter((url): url is string => Boolean(url)),
        ),
      ],
    };
  });
}

export function sortSchedulesForCalendarDay(
  schedules: FlattenedSchedule[],
): FlattenedSchedule[] {
  return [...schedules].sort((a, b) => {
    const hubDelta = Number(isBongnudoHubSchedule(b)) - Number(isBongnudoHubSchedule(a));
    if (hubDelta !== 0) return hubDelta;
    return scheduleStartMs(a.startTime) - scheduleStartMs(b.startTime);
  });
}

export function getBongnudoBandRole(
  dateKey: string,
  hubDateKeys: ReadonlySet<string>,
  weekDateKeys: readonly string[],
): BongnudoBandRole | null {
  if (!hubDateKeys.has(dateKey)) return null;
  const idx = weekDateKeys.indexOf(dateKey);
  if (idx < 0) return 'only';
  const hasPrev = idx > 0 && hubDateKeys.has(weekDateKeys[idx - 1]!);
  const hasNext =
    idx < weekDateKeys.length - 1 && hubDateKeys.has(weekDateKeys[idx + 1]!);
  if (hasPrev && hasNext) return 'middle';
  if (hasPrev) return 'end';
  if (hasNext) return 'start';
  return 'only';
}

export function bandRoleForCalendarDay(
  day: Date,
  weekDays: Date[],
  schedulesByDate: Map<string, FlattenedSchedule[]>,
): BongnudoBandRole | null {
  const dateKey = format(day, 'yyyy-MM-dd');
  const keys = weekDays.map((weekDay) => format(weekDay, 'yyyy-MM-dd'));
  const hubs = new Set<string>();
  for (const key of keys) {
    if ((schedulesByDate.get(key) ?? []).some(isBongnudoHubSchedule)) {
      hubs.add(key);
    }
  }
  return getBongnudoBandRole(dateKey, hubs, keys);
}

export function bongnudoBandRadiusClass(role: BongnudoBandRole): string {
  if (role === 'start') return 'rounded-l-lg rounded-r-none';
  if (role === 'middle') return 'rounded-none';
  if (role === 'end') return 'rounded-r-lg rounded-l-none';
  return 'rounded-lg';
}

/** 주간 그리드 칸 사이 틈을 메워 하루짜리 일정이 이어져 보이게 */
export function bongnudoBandBridgeClass(role: BongnudoBandRole): string {
  if (role === 'start') return '-mr-1.5 sm:-mr-2';
  if (role === 'middle') return '-mx-1.5 sm:-mx-2';
  if (role === 'end') return '-ml-1.5 sm:-ml-2';
  return '';
}

export function isBongnudoHubSessionDay(
  schedule: FlattenedSchedule,
  now = new Date(),
): boolean {
  if (!isBongnudoHubSchedule(schedule)) return false;
  const dateKey = kstDateKey(schedule.startTime);
  return dateKey === getBongnudoSessionDate(now) && isBongnudoOperatingDay(dateKey);
}

export function isBongnudoHubLive(
  schedule: FlattenedSchedule,
  liveIds: Set<string> | undefined,
  now = new Date(),
): boolean {
  if (!liveIds?.size || !isBongnudoHubSchedule(schedule)) return false;
  if (getBongnudoStatus(now).phase !== 'live') return false;
  if (kstDateKey(schedule.startTime) !== getBongnudoSessionDate(now)) return false;
  return schedule.participants.some((participant) => liveIds.has(participant.id));
}

export function isBongnudoClip(clip: {
  title: string;
  description?: string | null;
  schedule?: { title?: string | null; game?: { title?: string | null } | null } | null;
}): boolean {
  const blob = `${clip.title} ${clip.description ?? ''} ${clip.schedule?.title ?? ''} ${clip.schedule?.game?.title ?? ''}`;
  return RELATED_KEYWORD.test(blob);
}

/** 검색·허브에 잡히도록 제목에 봉누도 표기를 붙임 */
export function stampBongnudoClipTitle(title: string): string {
  const trimmed = title.trim();
  if (/봉누도/i.test(trimmed)) return trimmed;
  return `봉누도 · ${trimmed}`;
}

export function isBongnudoRosterName(name: string): boolean {
  return ROSTER_SET.has(name) || GUEST_SET.has(name);
}

export function mergeBongnudoClips(
  groups: ClipWithParticipants[][],
): ClipWithParticipants[] {
  const seen = new Set<string>();
  const merged: ClipWithParticipants[] = [];
  for (const group of groups) {
    for (const clip of group) {
      if (seen.has(clip.id)) continue;
      seen.add(clip.id);
      merged.push(clip);
    }
  }
  return merged.sort((a, b) => {
    const aTime = new Date(a.clipDate ?? a.createdAt).getTime();
    const bTime = new Date(b.clipDate ?? b.createdAt).getTime();
    return bTime - aTime;
  });
}

export function pickBongnudoMultiview(
  roster: Streamer[],
  liveIds: Iterable<string>,
  liveOnly: boolean,
): Streamer[] {
  const live = new Set(liveIds);
  const liveMembers = roster.filter((s) => live.has(s.id));
  const pool = liveOnly && liveMembers.length > 0 ? liveMembers : roster;
  if (pool.length <= MAX_STREAMS) return pool;
  return [...pool]
    .sort((a, b) => Number(live.has(b.id)) - Number(live.has(a.id)))
    .slice(0, MAX_STREAMS);
}

