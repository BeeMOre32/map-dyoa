import type { ParticipantEntry } from '@/components/Form/types';
import type { Game, Streamer } from '@prisma/client';
import {
  buildScheduleActionPayload,
  resolveGameId,
} from '@/lib/schedule-payload';
import {
  createEmptyParticipant,
  isHoi4GameById,
  resolveNaeJeonForPayload,
  syncParticipantEntries,
} from '@/lib/hoi4/hoi4FormUtils';

export { resolveGameId };

export type ExtractedSchedule = {
  key: string;
  title: string;
  date: string | null;
  time: string | null;
  gameId: string | null;
  gameName: string | null;
  streamerIds: string[];
  streamerNames: string[];
  editingStreamers: boolean;
  isNaeJeon: boolean;
  participants: ParticipantEntry[];
};

export type RawExtractedSchedule = Omit<ExtractedSchedule, 'key' | 'editingStreamers'>;

export function normalizeExtractedSchedule(
  s: Partial<RawExtractedSchedule>,
  key: string,
): ExtractedSchedule {
  return {
    key,
    title: s.title ?? '',
    date: s.date ?? null,
    time: s.time ?? null,
    gameId: s.gameId ?? null,
    gameName: s.gameName ?? null,
    streamerIds: (s.streamerIds ?? []).filter(
      (id): id is string => typeof id === 'string' && id.trim().length > 0,
    ),
    streamerNames: s.streamerNames ?? [],
    editingStreamers:
      'editingStreamers' in s && typeof s.editingStreamers === 'boolean'
        ? s.editingStreamers
        : false,
    isNaeJeon: Boolean(s.isNaeJeon),
    participants:
      Array.isArray(s.participants) && s.participants.length > 0
        ? (s.participants as ParticipantEntry[])
        : (s.streamerIds ?? []).map((id) => createEmptyParticipant(id)),
  };
}

export function syncExtractedParticipants(
  schedule: Pick<ExtractedSchedule, 'streamerIds' | 'participants' | 'isNaeJeon'>,
  streamers: Pick<Streamer, 'id' | 'isGuest'>[],
  updates: {
    streamerIds?: string[];
    participants?: ParticipantEntry[];
    isNaeJeon?: boolean;
  },
): Pick<ExtractedSchedule, 'streamerIds' | 'participants' | 'isNaeJeon'> {
  const streamerIds = updates.streamerIds ?? schedule.streamerIds;
  const guestIds = (updates.participants ?? schedule.participants)
    .filter((p) => p.isGuest)
    .map((p) => p.id);
  const participants = syncParticipantEntries(
    streamerIds,
    guestIds,
    updates.participants ?? schedule.participants,
    streamers,
  );
  const isNaeJeon = updates.isNaeJeon ?? schedule.isNaeJeon;
  return { streamerIds, participants, isNaeJeon };
}

export function buildExtractedScheduleActionPayload(
  s: Pick<
    ExtractedSchedule,
    | 'title'
    | 'date'
    | 'time'
    | 'gameId'
    | 'gameName'
    | 'streamerIds'
    | 'participants'
    | 'isNaeJeon'
  >,
  streamers: Pick<Streamer, 'id' | 'isGuest'>[],
  games: Pick<Game, 'id' | 'title' | 'isHoi4'>[],
) {
  const hasTime = !!s.time?.trim();
  const d = new Date(s.date ?? new Date().toISOString().split('T')[0]);
  if (hasTime && s.time) {
    const [h, m] = s.time.split(':');
    d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
  } else {
    d.setHours(0, 0, 0, 0);
  }

  const resolvedGameId = resolveGameId(s.gameId, s.gameName, games);
  const isHoi4Game = resolvedGameId
    ? isHoi4GameById(resolvedGameId, games)
    : false;
  const participants =
    s.participants.length > 0
      ? s.participants
      : s.streamerIds.map((id) => ({
          ...createEmptyParticipant(id),
          isGuest: streamers.find((st) => st.id === id)?.isGuest ?? false,
        }));

  return buildScheduleActionPayload({
    title: s.title,
    startTime: d,
    participants: participants.map(({ id, nation, isGuest }) => ({
      id,
      nation,
      isGuest,
    })),
    gameId: s.gameId,
    gameName: s.gameName,
    games,
    isGuerrilla: !hasTime,
    isNaeJeon: resolveNaeJeonForPayload(isHoi4Game, s.isNaeJeon, participants),
  });
}
