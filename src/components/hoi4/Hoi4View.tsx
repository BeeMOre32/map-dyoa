'use client';

import FavoritesOnlyToggle from '@/components/Common/FavoritesOnlyToggle';
import type { Hoi4LeaderboardData } from '@/lib/data-fetching';
import { countUniqueHoi4Nations } from '@/lib/hoi4/hoi4ViewUtils';
import { useHoi4ViewState } from '@/hooks/useHoi4ViewState';
import Hoi4EmptyState from '@/components/hoi4/atoms/Hoi4EmptyState';
import Hoi4FilterEmptyBanner from '@/components/hoi4/atoms/Hoi4FilterEmptyBanner';
import Hoi4Hero from '@/components/hoi4/atoms/Hoi4Hero';
import Hoi4MemberGrid from '@/components/hoi4/atoms/Hoi4MemberGrid';
import Hoi4SessionList from '@/components/hoi4/atoms/Hoi4SessionList';

interface Hoi4ViewProps {
  data: Hoi4LeaderboardData;
}

export default function Hoi4View({ data }: Hoi4ViewProps) {
  const state = useHoi4ViewState(data);

  if (state.leaderboard.length === 0) {
    return <Hoi4EmptyState />;
  }

  const nationCount = countUniqueHoi4Nations(state.leaderboard);
  const memberCount = state.hasActiveFilter
    ? state.filteredLeaderboard.length
    : state.leaderboard.length;
  const sessionCount = state.hasActiveFilter
    ? state.filteredSessions.length
    : state.totalSessions;

  return (
    <div className="flex-1 overflow-y-auto bg-white transition-colors dark:bg-slate-950">
      <Hoi4Hero
        memberCount={memberCount}
        sessionCount={sessionCount}
        nationCount={nationCount}
      />

      <div className="mx-auto max-w-4xl space-y-8 px-4 pb-16 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <FavoritesOnlyToggle />
          {state.hasActiveFilter ? (
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
              관심 멤버 기준으로 표시 중
            </span>
          ) : null}
        </div>

        {state.showFilterEmpty ? (
          <Hoi4FilterEmptyBanner onClear={state.clearFilter} />
        ) : null}

        {state.filteredLeaderboard.length > 0 ? (
          <Hoi4MemberGrid
            entries={state.filteredLeaderboard}
            maxParticipations={state.maxParticipations}
          />
        ) : null}

        {state.filteredSessions.length > 0 ? (
          <Hoi4SessionList
            sessions={state.visibleSessionList}
            canLoadMore={state.canLoadMore}
            onLoadMore={state.loadMoreSessions}
          />
        ) : null}
      </div>
    </div>
  );
}
