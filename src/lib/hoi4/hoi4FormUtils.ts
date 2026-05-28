import type { ParticipantEntry } from '@/components/Form/types';
import type { Hoi4LeaderboardData } from '@/lib/data-fetching';

export function createEmptyParticipant(
  id: string,
  isGuest = false,
): ParticipantEntry {
  return { id, nation: '', isGuest };
}

export function isHoi4GameById(
  gameId: string,
  games: { id: string; isHoi4?: boolean }[],
): boolean {
  return games.find((g) => g.id === gameId)?.isHoi4 ?? false;
}

export function participantsHaveNation(
  participants: Pick<ParticipantEntry, 'nation'>[],
): boolean {
  return participants.some((p) => p.nation.trim().length > 0);
}

/** HOI4 + (내전 체크 또는 국가 입력) → 전적 집계 대상 */
export function resolveNaeJeonForPayload(
  isHoi4Game: boolean,
  isNaeJeon: boolean,
  participants: Pick<ParticipantEntry, 'nation'>[],
): boolean {
  if (!isHoi4Game) return false;
  return isNaeJeon || participantsHaveNation(participants);
}

export function syncParticipantEntries(
  streamerIds: string[],
  guestIds: string[],
  prev: ParticipantEntry[],
  streamers: { id: string; isGuest?: boolean }[],
): ParticipantEntry[] {
  const streamerMap = new Map(streamers.map((s) => [s.id, s]));
  const prevMap = new Map(prev.map((p) => [p.id, p]));
  return streamerIds.map((id) => {
    const existing = prevMap.get(id);
    const isGuest = guestIds.includes(id);
    if (existing) return { ...existing, isGuest };
    const streamer = streamerMap.get(id);
    return createEmptyParticipant(id, isGuest || streamer?.isGuest || false);
  });
}

export function nationEntryParticipants(
  isNaeJeon: boolean,
  participants: ParticipantEntry[],
): ParticipantEntry[] {
  return isNaeJeon ? participants : participants.filter((p) => !p.isGuest);
}

export type Hoi4FilterState = {
  memberId: string | null;
  nationQuery: string;
  periodMonths: number | null;
};

export const HOI4_PERIOD_OPTIONS = [
  { value: '', label: '전체 기간' },
  { value: '3', label: '최근 3개월' },
  { value: '6', label: '최근 6개월' },
  { value: '12', label: '최근 1년' },
] as const;

function participantMatchesActiveFilters(
  p: Hoi4LeaderboardData['sessions'][number]['participants'][number],
  filters: Hoi4FilterState,
  nationQuery: string,
  options?: { favoriteIds?: Set<string>; favoritesOnly?: boolean },
): boolean {
  if (filters.memberId && p.streamer.id !== filters.memberId) return false;
  if (nationQuery && !p.nation?.toLowerCase().includes(nationQuery)) return false;
  if (options?.favoritesOnly && options.favoriteIds && options.favoriteIds.size > 0) {
    if (!options.favoriteIds.has(p.streamer.id)) return false;
  }
  return true;
}

function rebuildLeaderboardFromSessions(
  sessions: Hoi4LeaderboardData['sessions'],
  filters: Hoi4FilterState,
  nationQuery: string,
  options?: { favoriteIds?: Set<string>; favoritesOnly?: boolean },
): Hoi4LeaderboardData['leaderboard'] {
  type StatEntry = Hoi4LeaderboardData['leaderboard'][number];
  const statsMap = new Map<string, StatEntry>();

  for (const session of sessions) {
    for (const p of session.participants) {
      if (!participantMatchesActiveFilters(p, filters, nationQuery, options)) continue;

      if (!statsMap.has(p.streamer.id)) {
        statsMap.set(p.streamer.id, {
          streamer: p.streamer,
          total: 0,
          nations: [],
        });
      }
      const stat = statsMap.get(p.streamer.id)!;
      stat.total += 1;
      if (p.nation && !stat.nations.includes(p.nation)) {
        stat.nations.push(p.nation);
      }
    }
  }

  return Array.from(statsMap.values()).sort((a, b) => b.total - a.total);
}

export function filterHoi4LeaderboardData(
  data: Hoi4LeaderboardData,
  filters: Hoi4FilterState,
  options?: { favoriteIds?: Set<string>; favoritesOnly?: boolean },
): {
  leaderboard: Hoi4LeaderboardData['leaderboard'];
  sessions: Hoi4LeaderboardData['sessions'];
  totalSessions: number;
  hasActiveFilter: boolean;
} {
  const nationQuery = filters.nationQuery.trim().toLowerCase();
  const periodCutoff =
    filters.periodMonths != null
      ? new Date(Date.now() - filters.periodMonths * 30 * 24 * 60 * 60 * 1000)
      : null;

  let sessions = data.sessions;

  if (periodCutoff) {
    sessions = sessions.filter(
      (s) => new Date(s.startTime).getTime() >= periodCutoff.getTime(),
    );
  }

  const hasParticipantFilter =
    !!filters.memberId ||
    nationQuery.length > 0 ||
    !!(options?.favoritesOnly && options.favoriteIds && options.favoriteIds.size > 0);

  if (hasParticipantFilter) {
    sessions = sessions.filter((s) =>
      s.participants.some((p) =>
        participantMatchesActiveFilters(p, filters, nationQuery, options),
      ),
    );
  }

  const leaderboard = rebuildLeaderboardFromSessions(
    sessions,
    filters,
    nationQuery,
    options,
  );

  const filteredSessions = hasParticipantFilter
    ? sessions.map((s) => ({
        ...s,
        participants: s.participants.filter((p) =>
          participantMatchesActiveFilters(p, filters, nationQuery, options),
        ),
      }))
    : sessions;

  const hasActiveFilter =
    !!filters.memberId ||
    nationQuery.length > 0 ||
    filters.periodMonths != null ||
    !!(options?.favoritesOnly && options.favoriteIds && options.favoriteIds.size > 0);

  return {
    leaderboard,
    sessions: filteredSessions,
    totalSessions: filteredSessions.length,
    hasActiveFilter,
  };
}
