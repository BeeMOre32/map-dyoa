import { format, differenceInCalendarDays, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import type {
  Hoi4ExamStaffRole,
  Hoi4GermanExamConfig,
  Hoi4GermanExamEntry,
} from '@/config/hoi4GermanExam2026';
import type { Hoi4GermanExamBinding } from '@/lib/hoi4-exam-binding';
import type { Hoi4ExamRuntimeState } from '@/lib/hoi4-exam-state';
import {
  examEventDayEnd,
  formatKstDateLabel,
  formatKstTimeLabel,
  kstDateKey,
} from '@/lib/hoi4-exam-time';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';
import type { ParticipantFlat } from '@/lib/schedule-formatters';
import { getStreamerImagePath } from '@/lib/utils';

export type { Hoi4GermanExamBinding } from '@/lib/hoi4-exam-binding';
export { resolveHoi4GermanExamBinding, formatExamScheduleSummary } from '@/lib/hoi4-exam-binding';

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

export type ExamStaffGroup = {
  role: Hoi4ExamStaffRole;
  label: string;
  members: ExamMemberSnapshot[];
};

export type Hoi4GermanExamViewModel = {
  examId: string | null;
  phase: ExamPhase;
  /** 일정상 출발 시각 (ISO) — DB 일정 startTime */
  scheduledStartAt: string | null;
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
  staffGroups: ExamStaffGroup[];
  staffCount: number;
  schedule: FlattenedSchedule | null;
  multiviewHref: string | null;
};

export type ExamMemberSnapshot = Pick<
  ExamLeaderboardRow,
  'streamerId' | 'name' | 'profileImg' | 'colorCode'
>;

const STAFF_ROLE_LABEL: Record<Hoi4ExamStaffRole, string> = {
  broadcast: '중계진',
  helper: '도우미',
};

function getEventStaffIds(config: Hoi4GermanExamConfig): Set<string> {
  return new Set(config.eventStaff.map((staff) => staff.streamerId));
}

function excludeEventStaff(
  participants: ParticipantFlat[],
  config: Hoi4GermanExamConfig,
): ParticipantFlat[] {
  const excluded = getEventStaffIds(config);
  for (const streamerId of config.excludedStreamerIds ?? []) {
    excluded.add(streamerId);
  }
  if (excluded.size === 0) return participants;
  return participants.filter((participant) => !excluded.has(participant.id));
}

function toMemberSnapshot(participant: ParticipantFlat): ExamMemberSnapshot {
  return {
    streamerId: participant.id,
    name: participant.name,
    profileImg: resolveProfileImg(participant.name, participant.profileImg),
    colorCode: participant.colorCode,
  };
}

function buildExamStaffGroups(
  participants: ParticipantFlat[],
  config: Hoi4GermanExamConfig,
): ExamStaffGroup[] {
  const participantById = new Map(
    participants.map((participant) => [participant.id, participant]),
  );
  const groups = new Map<Hoi4ExamStaffRole, ExamMemberSnapshot[]>();

  for (const staff of config.eventStaff) {
    const participant = participantById.get(staff.streamerId);
    if (!participant) continue;
    const members = groups.get(staff.role) ?? [];
    members.push(toMemberSnapshot(participant));
    groups.set(staff.role, members);
  }

  return Array.from(groups.entries()).map(([role, members]) => ({
    role,
    label: STAFF_ROLE_LABEL[role],
    members,
  }));
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

export function computeExamPhase(start: Date, now = new Date()): ExamPhase {
  const end = examEventDayEnd(start);
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
  const dayEnd = examEventDayEnd(input.scheduledStart);
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
  const dDayLabel = computeDDayLabel(scheduledStart, phase, now);
  const isTodayBeforeStart =
    timerMode === 'countdown' &&
    kstDateKey(scheduledStart) === kstDateKey(now) &&
    now < scheduledStart;
  return {
    dDayLabel,
    heroBadge: isTodayBeforeStart ? '오늘 출발' : '예정',
  };
}

/** 출발 시각 우선 — 당일·출발 전에는 D-day 대신 출발 시각 표시 */
export function computeDDayLabel(
  start: Date,
  phase: ExamPhase,
  now = new Date(),
): string {
  if (phase === 'after') return '종료';
  if (now >= start) return 'D-day';

  const daysUntil = differenceInCalendarDays(startOfDay(start), startOfDay(now));
  if (daysUntil > 0) return `D-${daysUntil}`;

  // 같은 날·출발 전 — 자정이 아니라 출발 시각 기준
  if (kstDateKey(start) === kstDateKey(now)) {
    return formatKstTimeLabel(start);
  }

  return 'D+0';
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
  config: Hoi4GermanExamConfig;
  binding: Hoi4GermanExamBinding;
  now?: Date;
  runtime?: Hoi4ExamRuntimeState;
  entries?: readonly Hoi4GermanExamEntry[];
}): Hoi4GermanExamViewModel {
  const { config, binding, now = new Date(), runtime, entries } = input;
  const { schedule, examId, scheduledStart } = binding;

  if (!schedule || !scheduledStart) {
    return {
      examId: null,
      phase: 'before',
      scheduledStartAt: null,
      manualStartedAt: null,
      timerMode: 'hidden',
      timerAnchorAt: null,
      waitingForGo: false,
      dDayLabel: '—',
      heroBadge: '일정 없음',
      startTimeLabel: '—',
      eventDateLabel: '일정 미연동',
      participantCount: 0,
      clearedCount: 0,
      topName: null,
      topGameDate: null,
      rows: [],
      staffGroups: [],
      staffCount: 0,
      schedule: null,
      multiviewHref: null,
    };
  }

  const staffGroups = buildExamStaffGroups(schedule.participants, config);
  const staffCount = staffGroups.reduce(
    (total, group) => total + group.members.length,
    0,
  );
  const participants = excludeEventStaff(schedule.participants, config);
  const members = participants.filter((p) => !p.isGuest);
  const entryList = entries ?? config.entries;
  const rows = buildExamLeaderboard(participants, entryList);
  const clearedCount = rows.filter((r) => r.hasRecord).length;
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
    examId,
    phase,
    scheduledStartAt: scheduledStart.toISOString(),
    manualStartedAt: runtime?.manualStartedAt ?? null,
    timerMode,
    timerAnchorAt,
    waitingForGo: timerMode === 'waiting',
    dDayLabel,
    heroBadge,
    startTimeLabel: formatKstTimeLabel(scheduledStart),
    eventDateLabel: formatKstDateLabel(scheduledStart),
    participantCount: members.length,
    clearedCount,
    topName: top?.name ?? null,
    topGameDate: top?.clearGameDate ?? null,
    rows,
    staffGroups,
    staffCount,
    schedule,
    multiviewHref,
  };
}

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
  if (!model.scheduledStartAt) {
    return {
      ...model,
      manualStartedAt: runtime.manualStartedAt,
    };
  }

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
  const scheduledStart = base.scheduledStartAt
    ? new Date(base.scheduledStartAt)
    : new Date();
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
