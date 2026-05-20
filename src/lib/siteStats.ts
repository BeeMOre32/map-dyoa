import type { FlattenedSchedule } from '@/lib/schedule-formatters';
import type { ClipWithParticipants } from '@/types/entities';

export type ExtendedSiteContentStats = {
  scheduleCount: number;
  clipCount: number;
  memberCount: number;
  gameCount: number;
  guestStreamerCount: number;
  guerrillaCount: number;
  naejeonCount: number;
  hoi4ScheduleCount: number;
  gameLinkedScheduleCount: number;
  soloScheduleCount: number;
  collabScheduleCount: number;
  clipLinkedScheduleCount: number;
  avgParticipantsPerSchedule: number;
};

export function computeExtendedSiteContentStats(input: {
  schedules: FlattenedSchedule[];
  clips: ClipWithParticipants[];
  memberCount: number;
  gameCount: number;
  guestStreamerCount: number;
  clipCountTotal?: number;
}): ExtendedSiteContentStats {
  const {
    schedules,
    clips,
    memberCount,
    gameCount,
    guestStreamerCount,
    clipCountTotal,
  } = input;

  let guerrillaCount = 0;
  let naejeonCount = 0;
  let hoi4ScheduleCount = 0;
  let gameLinkedScheduleCount = 0;
  let soloScheduleCount = 0;
  let collabScheduleCount = 0;
  let participantSlots = 0;

  for (const schedule of schedules) {
    if (schedule.isGuerrilla) guerrillaCount += 1;
    if (schedule.isNaeJeon) naejeonCount += 1;
    if (schedule.game?.isHoi4) hoi4ScheduleCount += 1;
    if (schedule.game) gameLinkedScheduleCount += 1;

    const members = schedule.participants.filter((p) => !p.isGuest);
    participantSlots += members.length;
    if (members.length >= 2) collabScheduleCount += 1;
    else if (members.length === 1) soloScheduleCount += 1;
  }

  const clipLinkedScheduleCount = clips.filter((clip) => clip.scheduleId != null).length;

  return {
    scheduleCount: schedules.length,
    clipCount: clipCountTotal ?? clips.length,
    memberCount,
    gameCount,
    guestStreamerCount,
    guerrillaCount,
    naejeonCount,
    hoi4ScheduleCount,
    gameLinkedScheduleCount,
    soloScheduleCount,
    collabScheduleCount,
    clipLinkedScheduleCount,
    avgParticipantsPerSchedule:
      schedules.length > 0
        ? Math.round((participantSlots / schedules.length) * 10) / 10
        : 0,
  };
}
