'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFavoriteStreamers } from '@/hooks/useFavoriteStreamers';
import type { Hoi4LeaderboardData } from '@/lib/data-fetching';
import { HOI4_SESSIONS_PAGE } from '@/lib/hoi4/hoi4ViewUtils';

export function useHoi4ViewState(data: Hoi4LeaderboardData) {
  const { leaderboard, sessions, totalSessions } = data;
  const { favoriteIds, favoritesOnly, setFavoritesOnly } = useFavoriteStreamers();
  const [visibleSessions, setVisibleSessions] = useState(HOI4_SESSIONS_PAGE);

  useEffect(() => {
    setVisibleSessions(HOI4_SESSIONS_PAGE);
  }, [favoritesOnly]);

  const filteredLeaderboard = useMemo(() => {
    if (!favoritesOnly || favoriteIds.size === 0) return leaderboard;
    return leaderboard.filter((entry) => favoriteIds.has(entry.streamer.id));
  }, [leaderboard, favoritesOnly, favoriteIds]);

  const filteredSessions = useMemo(() => {
    if (!favoritesOnly || favoriteIds.size === 0) return sessions;
    return sessions.filter((session) =>
      session.participants.some((p) => favoriteIds.has(p.streamer.id)),
    );
  }, [sessions, favoritesOnly, favoriteIds]);

  const hasActiveFilter = favoritesOnly && favoriteIds.size > 0;
  const showFilterEmpty =
    hasActiveFilter &&
    filteredLeaderboard.length === 0 &&
    filteredSessions.length === 0 &&
    (leaderboard.length > 0 || sessions.length > 0);

  const visibleSessionList = filteredSessions.slice(0, visibleSessions);
  const canLoadMore = visibleSessions < filteredSessions.length;
  const maxParticipations = filteredLeaderboard[0]?.total ?? 1;

  return {
    leaderboard,
    sessions,
    totalSessions,
    favoritesOnly,
    setFavoritesOnly,
    filteredLeaderboard,
    filteredSessions,
    hasActiveFilter,
    showFilterEmpty,
    visibleSessionList,
    canLoadMore,
    maxParticipations,
    loadMoreSessions: () => setVisibleSessions((n) => n + HOI4_SESSIONS_PAGE),
    clearFilter: () => setFavoritesOnly(false),
  };
}
