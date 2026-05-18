import type { Game, Streamer } from '@prisma/client';
import {
  buildScheduleActionPayload,
  resolveGameId,
} from '@/lib/schedule-payload';

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
  };
}

export function buildExtractedScheduleActionPayload(
  s: Pick<
    ExtractedSchedule,
    'title' | 'date' | 'time' | 'gameId' | 'gameName' | 'streamerIds'
  >,
  streamers: Pick<Streamer, 'id' | 'isGuest'>[],
  games: Pick<Game, 'id' | 'title'>[],
) {
  const hasTime = !!s.time?.trim();
  const d = new Date(s.date ?? new Date().toISOString().split('T')[0]);
  if (hasTime && s.time) {
    const [h, m] = s.time.split(':');
    d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
  } else {
    d.setHours(0, 0, 0, 0);
  }

  return buildScheduleActionPayload({
    title: s.title,
    startTime: d,
    participants: s.streamerIds.map((id) => ({
      id,
      isGuest: streamers.find((st) => st.id === id)?.isGuest ?? false,
    })),
    gameId: s.gameId,
    gameName: s.gameName,
    games,
    isGuerrilla: !hasTime,
    isNaeJeon: false,
  });
}
