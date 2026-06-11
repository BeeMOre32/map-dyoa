import { format, parseISO, differenceInCalendarDays, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { HOI4_GERMAN_EXAM_2026, Hoi4GermanExamEntry } from '@/config/hoi4GermanExam2026';
import type { Hoi4ExamRuntimeState } from '@/lib/hoi4-exam-state';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';
import type { ParticipantFlat } from '@/lib/schedule-formatters';
import { getStreamerImagePath } from '@/lib/utils';

function resolveProfileImg(name: string, profileImg?: string | null): string {
  const trimmed = profileImg?.trim();
  return trimmed ? trimmed : getStreamerImagePath(name);
}

export type ExamPhase = 'before' | 'live' | 'after';
export type ExamTimerMode = 'countdown' | 'elapsed' | 'waiting' | 'hidden';

export type ExamLeaderboardRow = {
  rank: number | null;
  streamerId: string;
  name: string;
  profileImg: string | null;
  colorCode: string;
  clearGameDate: string | null;
  playTime: string | null;
  clearedAtKst: string | null;
  vodUrl: string | null;
  hasRecord: boolean;
};

export type Hoi4GermanExamViewModel = {
  phase: ExamPhase;
  /** 일정상 출발 시각 (ISO) */
  scheduledStartAt: string;
  /** 운영자 수동 출발 시각 */
  manualStartedAt: string | null;
  timerMode: ExamTimerMode;
  timerAnchorAt: string | null;
  waitingForGo: boolean;
  dDayLabel: string;
  heroBadge: string;
  startTimeLabel: string;
  eventDateLabel: string;
  participantCount: number;
  clearedCount: number;
  topName: string | null;
  topGameDate: string | null;
  rows: ExamLeaderboardRow[];
  schedule: FlattenedSchedule | null;
  multiviewHref: string | null;
};

type ExamConfig = typeof HOI4_GERMAN_EXAM_2026;

function excludeCommentators(
  participants: ParticipantFlat[],
  config: ExamConfig,
): ParticipantFlat[] {
  const excluded = new Set<string>(config.excludedStreamerIds ?? []);
  if (excluded.size === 0) return participants;
  return participants.filter((participant) => !excluded.has(participant.id));
}

/** 게임 내 날짜 문자열 → 정렬용 타임스탬프 */
export function parseGameDateKey(value: string): number | null {
  const normalized = value.trim().replace(/\./g, '-').replace(/\s+/g, '');
  const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return Number.isFinite(date.getTime()) ? date.getTime() : null;
}

export function formatGameDateDisplay(value: string): string {
  const key = parseGameDateKey(value);
  if (key == null) return value;
  return format(new Date(key), 'yyyy. M. d', { locale: ko });
}

export function formatPlayTimeMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const secSuffix = seconds > 0 ? ` ${seconds.toString().padStart(2, '0')}s` : '';
  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m${secSuffix}`;
  }
  if (minutes > 0) return `${minutes}m${secSuffix}`;
  return `${seconds}s`;
}

function parseConfigStartAt(config: ExamConfig): Date {
  return parseISO(config.startAtKst);
}

export function resolveEventStart(
  config: ExamConfig,
  schedule: FlattenedSchedule | null,
): Date {
  if (schedule) return new Date(schedule.startTime);
  return parseConfigStartAt(config);
}

function eventDayEnd(start: Date): Date {
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return end;
}

export function computeExamPhase(start: Date, now = new Date()): ExamPhase {
  const end = eventDayEnd(start);
  if (now < start) return 'before';
  if (now < end) return 'live';
  return 'after';
}

/** 7시 자동 시작 없이 — 운영자 수동 출발·종료 기준 */
export function computeExamPhaseWithManual(input: {
  scheduledStart: Date;
  now?: Date;
  manualStartedAt?: Date | null;
  manualEndedAt?: Date | null;
}): ExamPhase {
  const now = input.now ?? new Date();
  const dayEnd = eventDayEnd(input.scheduledStart);
  if (now >= dayEnd) return 'after';
  if (input.manualEndedAt) return 'after';
  if (input.manualStartedAt) return 'live';
  return 'before';
}

export function resolveExamTimerMode(input: {
  phase: ExamPhase;
  scheduledStart: Date;
  now?: Date;
  manualStartedAt?: Date | null;
}): { mode: ExamTimerMode; anchorAt: string | null } {
  const now = input.now ?? new Date();
  if (input.phase === 'after') {
    return { mode: 'hidden', anchorAt: null };
  }
  if (input.manualStartedAt) {
    return { mode: 'elapsed', anchorAt: input.manualStartedAt.toISOString() };
  }
  if (now < input.scheduledStart) {
    return { mode: 'countdown', anchorAt: input.scheduledStart.toISOString() };
  }
  return { mode: 'waiting', anchorAt: null };
}

function resolveExamPresentation(input: {
  scheduledStart: Date;
  phase: ExamPhase;
  timerMode: ExamTimerMode;
  now?: Date;
}): { dDayLabel: string; heroBadge: string } {
  const { scheduledStart, phase, timerMode, now = new Date() } = input;

  if (phase === 'after') {
    return { dDayLabel: 'FINAL', heroBadge: '종료' };
  }
  if (phase === 'live') {
    return { dDayLabel: 'LIVE', heroBadge: '진행 중' };
  }
  if (timerMode === 'waiting') {
    return { dDayLabel: 'READY', heroBadge: '출발 대기' };
  }
  return {
    dDayLabel: computeDDayLabel(scheduledStart, phase, now),
    heroBadge: '예정',
  };
}

export function computeDDayLabel(
  start: Date,
  phase: ExamPhase,
  now = new Date(),
): string {
  if (phase === 'after') return '종료';
  const days = differenceInCalendarDays(startOfDay(start), startOfDay(now));
  if (days > 0) return `D-${days}`;
  if (days === 0) return 'D-day';
  return 'D+0';
}

export function resolveExamSchedule(
  schedules: FlattenedSchedule[],
  config: ExamConfig,
): FlattenedSchedule | null {
  if (config.scheduleId) {
    const byId = schedules.find((s) => s.id === config.scheduleId);
    if (byId) return byId;
  }

  const dayMatches = schedules.filter(
    (s) => format(s.startTime, 'yyyy-MM-dd') === config.eventDate,
  );
  if (dayMatches.length === 0) return null;

  const keywords = config.scheduleTitleIncludes ?? [];
  if (keywords.length > 0) {
    const byTitle = dayMatches.find((s) =>
      keywords.some((kw) => s.title.includes(kw)),
    );
    if (byTitle) return byTitle;
  }

  return dayMatches.sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  )[0];
}

function entryMap(entries: readonly Hoi4GermanExamEntry[]): Map<string, Hoi4GermanExamEntry> {
  return new Map(entries.map((e) => [e.streamerId, e]));
}

function buildRow(
  participant: ParticipantFlat,
  entry: Hoi4GermanExamEntry | undefined,
  rank: number | null,
): ExamLeaderboardRow {
  const hasRecord = Boolean(entry?.clearGameDate);
  return {
    rank,
    streamerId: participant.id,
    name: participant.name,
    profileImg: resolveProfileImg(participant.name, participant.profileImg),
    colorCode: participant.colorCode,
    clearGameDate: entry?.clearGameDate
      ? formatGameDateDisplay(entry.clearGameDate)
      : null,
    playTime:
      entry?.playTimeMs != null ? formatPlayTimeMs(entry.playTimeMs) : null,
    clearedAtKst: entry?.clearedAtKst ?? null,
    vodUrl: entry?.vodUrl ?? null,
    hasRecord,
  };
}

export function buildExamLeaderboard(
  participants: ParticipantFlat[],
  entries: readonly Hoi4GermanExamEntry[],
): ExamLeaderboardRow[] {
  const map = entryMap(entries);
  const members = participants
    .filter((p) => !p.isGuest)
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  const withRecords = members
    .map((p) => ({ participant: p, entry: map.get(p.id) }))
    .filter(({ entry }) => entry?.clearGameDate)
    .sort((a, b) => {
      const dateA = parseGameDateKey(a.entry!.clearGameDate!) ?? Infinity;
      const dateB = parseGameDateKey(b.entry!.clearGameDate!) ?? Infinity;
      if (dateA !== dateB) return dateA - dateB;
      const timeA = a.entry!.playTimeMs ?? Infinity;
      const timeB = b.entry!.playTimeMs ?? Infinity;
      return timeA - timeB;
    });

  const rankedIds = new Set<string>();
  const rankedRows: ExamLeaderboardRow[] = withRecords.map(({ participant, entry }, i) => {
    rankedIds.add(participant.id);
    return buildRow(participant, entry, i + 1);
  });

  const unrankedRows = members
    .filter((p) => !rankedIds.has(p.id))
    .map((p) => buildRow(p, map.get(p.id), null));

  return [...rankedRows, ...unrankedRows];
}

export function buildHoi4GermanExamViewModel(input: {
  config: ExamConfig;
  schedules: FlattenedSchedule[];
  now?: Date;
  runtime?: Hoi4ExamRuntimeState;
  entries?: readonly Hoi4GermanExamEntry[];
}): Hoi4GermanExamViewModel {
  const { config, schedules, now = new Date(), runtime, entries } = input;
  const schedule = resolveExamSchedule(schedules, config);
  const participants = excludeCommentators(schedule?.participants ?? [], config);
  const members = participants.filter((p) => !p.isGuest);
  const entryList = entries ?? config.entries;
  const rows = buildExamLeaderboard(participants, entryList);
  const clearedCount = rows.filter((r) => r.hasRecord).length;
  const scheduledStart = resolveEventStart(config, schedule);
  const manualStartedAt = runtime?.manualStartedAt
    ? new Date(runtime.manualStartedAt)
    : null;
  const manualEndedAt = runtime?.manualEndedAt
    ? new Date(runtime.manualEndedAt)
    : null;
  const phase = computeExamPhaseWithManual({
    scheduledStart,
    now,
    manualStartedAt,
    manualEndedAt,
  });
  const { mode: timerMode, anchorAt: timerAnchorAt } = resolveExamTimerMode({
    phase,
    scheduledStart,
    now,
    manualStartedAt,
  });
  const { dDayLabel, heroBadge } = resolveExamPresentation({
    scheduledStart,
    phase,
    timerMode,
    now,
  });

  const top = rows.find((r) => r.rank === 1) ?? null;

  const multiviewHref =
    schedule && members.length >= 2
      ? `/calendar/schedule/${schedule.id}/multiview`
      : null;

  return {
    phase,
    scheduledStartAt: scheduledStart.toISOString(),
    manualStartedAt: runtime?.manualStartedAt ?? null,
    timerMode,
    timerAnchorAt,
    waitingForGo: timerMode === 'waiting',
    dDayLabel,
    heroBadge,
    startTimeLabel: format(scheduledStart, 'HH:mm'),
    eventDateLabel: format(scheduledStart, 'yyyy. MM. dd (EEE)', { locale: ko }),
    participantCount: members.length,
    clearedCount,
    topName: top?.name ?? null,
    topGameDate: top?.clearGameDate ?? null,
    rows,
    schedule,
    multiviewHref,
  };
}

export type ExamMemberSnapshot = Pick<
  ExamLeaderboardRow,
  'streamerId' | 'name' | 'profileImg' | 'colorCode'
>;

export type ExamTestPhase = 'auto' | ExamPhase;

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

/** 출발까지 남은 시간 — 일 포함 시 `2일 05:23:41` */
export function formatExamCountdown(remainingMs: number): string {
  const totalSec = Math.max(0, Math.floor(remainingMs / 1000));
  const days = Math.floor(totalSec / 86_400);
  const hours = Math.floor((totalSec % 86_400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const clock = `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
  return days > 0 ? `${days}일 ${clock}` : clock;
}

/** 출발 후 경과 시간 — `02:18:05` */
export function formatExamElapsed(elapsedMs: number): string {
  const totalSec = Math.max(0, Math.floor(elapsedMs / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}

/** UI 테스트용 샘플 클리어 기록 (상위 2명만) */
export function createSampleMockEntries(
  members: ExamMemberSnapshot[],
): Hoi4GermanExamEntry[] {
  const templates: Omit<Hoi4GermanExamEntry, 'streamerId'>[] = [
    {
      clearGameDate: '1941-08-04',
      playTimeMs: 2 * 3_600_000 + 18 * 60_000,
      clearedAtKst: '21:18',
      vodUrl: 'https://chzzk.naver.com',
    },
    {
      clearGameDate: '1941-11-02',
      playTimeMs: 3 * 3_600_000 + 5 * 60_000,
      clearedAtKst: '22:05',
    },
  ];

  return members.slice(0, templates.length).map((member, index) => ({
    streamerId: member.streamerId,
    ...templates[index],
  }));
}

export function buildRowsFromMemberSnapshots(
  members: ExamMemberSnapshot[],
  entries: readonly Hoi4GermanExamEntry[],
): ExamLeaderboardRow[] {
  const participants = members.map((member) => ({
    id: member.streamerId,
    name: member.name,
    profileImg: member.profileImg,
    colorCode: member.colorCode,
    isGuest: false,
    nation: null,
    result: null,
  })) as ParticipantFlat[];

  return buildExamLeaderboard(participants, entries);
}

function participantListRows(members: ExamMemberSnapshot[]): ExamLeaderboardRow[] {
  return members.map((member) => ({
    rank: null,
    streamerId: member.streamerId,
    name: member.name,
    profileImg: resolveProfileImg(member.name, member.profileImg),
    colorCode: member.colorCode,
    clearGameDate: null,
    playTime: null,
    clearedAtKst: null,
    vodUrl: null,
    hasRecord: false,
  }));
}

export function patchModelWithEntries(
  model: Hoi4GermanExamViewModel,
  members: ExamMemberSnapshot[],
  entries: readonly Hoi4GermanExamEntry[],
): Hoi4GermanExamViewModel {
  const rows =
    model.phase === 'before'
      ? participantListRows(members)
      : buildRowsFromMemberSnapshots(members, entries);
  const clearedCount = rows.filter((row) => row.hasRecord).length;
  const top = rows.find((row) => row.rank === 1) ?? null;

  return {
    ...model,
    rows,
    clearedCount,
    topName: top?.name ?? null,
    topGameDate: top?.clearGameDate ?? null,
  };
}

/** 당일 UI 미리보기 — 단계·샘플 기록 오버라이드 */
export function patchModelWithRuntimeState(
  model: Hoi4GermanExamViewModel,
  runtime: Hoi4ExamRuntimeState,
  now = new Date(),
): Hoi4GermanExamViewModel {
  const scheduledStart = new Date(model.scheduledStartAt);
  const manualStartedAt = runtime.manualStartedAt
    ? new Date(runtime.manualStartedAt)
    : null;
  const manualEndedAt = runtime.manualEndedAt
    ? new Date(runtime.manualEndedAt)
    : null;
  const phase = computeExamPhaseWithManual({
    scheduledStart,
    now,
    manualStartedAt,
    manualEndedAt,
  });
  const { mode: timerMode, anchorAt: timerAnchorAt } = resolveExamTimerMode({
    phase,
    scheduledStart,
    now,
    manualStartedAt,
  });
  const { dDayLabel, heroBadge } = resolveExamPresentation({
    scheduledStart,
    phase,
    timerMode,
    now,
  });

  return {
    ...model,
    phase,
    manualStartedAt: runtime.manualStartedAt,
    timerMode,
    timerAnchorAt,
    waitingForGo: timerMode === 'waiting',
    dDayLabel,
    heroBadge,
  };
}

export function applyExamTestOverrides(
  base: Hoi4GermanExamViewModel,
  members: ExamMemberSnapshot[],
  options: {
    testPhase: ExamTestPhase;
    useSampleRecords: boolean;
  },
): Hoi4GermanExamViewModel {
  const phase = options.testPhase === 'auto' ? base.phase : options.testPhase;
  const scheduledStart = new Date(base.scheduledStartAt);
  const { mode: timerMode, anchorAt: timerAnchorAt } =
    options.testPhase === 'auto'
      ? { mode: base.timerMode, anchorAt: base.timerAnchorAt }
      : options.testPhase === 'live'
        ? resolveExamTimerMode({
            phase: 'live',
            scheduledStart,
            manualStartedAt: new Date(Date.now() - (2 * 3600 + 18 * 60) * 1000),
          })
        : options.testPhase === 'after'
          ? { mode: 'hidden' as const, anchorAt: null }
          : resolveExamTimerMode({ phase: 'before', scheduledStart });

  let rows: ExamLeaderboardRow[];
  if (options.useSampleRecords) {
    rows = buildRowsFromMemberSnapshots(
      members,
      createSampleMockEntries(members),
    );
  } else if (phase === 'before') {
    rows = participantListRows(members);
  } else {
    rows = base.rows;
  }

  const clearedCount = rows.filter((row) => row.hasRecord).length;
  const top = rows.find((row) => row.rank === 1) ?? null;

  const presentation =
    options.testPhase === 'auto'
      ? { dDayLabel: base.dDayLabel, heroBadge: base.heroBadge }
      : resolveExamPresentation({
          scheduledStart,
          phase,
          timerMode,
        });

  return {
    ...base,
    phase,
    rows,
    timerMode,
    timerAnchorAt,
    waitingForGo: timerMode === 'waiting',
    dDayLabel: presentation.dDayLabel,
    heroBadge: presentation.heroBadge,
    clearedCount,
    topName: top?.name ?? null,
    topGameDate: top?.clearGameDate ?? null,
  };
}
