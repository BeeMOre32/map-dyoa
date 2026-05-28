'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFavoriteStreamers } from '@/hooks/useFavoriteStreamers';
import type { Hoi4LeaderboardData } from '@/lib/data-fetching';
import {
  filterHoi4LeaderboardData,
  type Hoi4FilterState,
} from '@/lib/hoi4/hoi4FormUtils';
import { HOI4_SESSIONS_PAGE } from '@/lib/hoi4/hoi4ViewUtils';

const DEFAULT_FILTERS: Hoi4FilterState = {
  memberId: null,
  nationQuery: '',
  periodMonths: null,
};

export function useHoi4ViewState(data: Hoi4LeaderboardData) {
  const { favoritesOnly, setFavoritesOnly, favoriteIds } = useFavoriteStreamers();
  const [filters, setFilters] = useState<Hoi4FilterState>(DEFAULT_FILTERS);
  const [visibleSessions, setVisibleSessions] = useState(HOI4_SESSIONS_PAGE);

  useEffect(() => {
    setVisibleSessions(HOI4_SESSIONS_PAGE);
  }, [filters, favoritesOnly]);

  const filtered = useMemo(
    () =>
      filterHoi4LeaderboardData(data, filters, {
        favoritesOnly,
        favoriteIds,
      }),
    [data, filters, favoritesOnly, favoriteIds],
  );

  const showFilterEmpty =
    filtered.hasActiveFilter &&
    filtered.leaderboard.length === 0 &&
    filtered.sessions.length === 0 &&
    (data.leaderboard.length > 0 || data.sessions.length > 0);

  const visibleSessionList = filtered.sessions.slice(0, visibleSessions);
  const canLoadMore = visibleSessions < filtered.sessions.length;
  const maxParticipations = filtered.leaderboard[0]?.total ?? 1;

  return {
    leaderboard: data.leaderboard,
    sessions: data.sessions,
    totalSessions: data.totalSessions,
    favoritesOnly,
    setFavoritesOnly,
    filters,
    setFilters,
    filteredLeaderboard: filtered.leaderboard,
    filteredSessions: filtered.sessions,
    filteredTotalSessions: filtered.totalSessions,
    hasActiveFilter: filtered.hasActiveFilter,
    showFilterEmpty,
    visibleSessionList,
    canLoadMore,
    maxParticipations,
    loadMoreSessions: () => setVisibleSessions((n) => n + HOI4_SESSIONS_PAGE),
    clearFilters: () => {
      setFilters(DEFAULT_FILTERS);
      setFavoritesOnly(false);
    },
    updateFilters: (next: Partial<Hoi4FilterState>) =>
      setFilters((prev) => ({ ...prev, ...next })),
  };
}
