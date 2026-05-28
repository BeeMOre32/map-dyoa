import { format, isValid } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Hoi4LeaderboardData } from '@/lib/data-fetching';

export const HOI4_SESSIONS_PAGE = 8;

export function formatHoi4SessionDate(d: Date | string) {
  const dt = new Date(d);
  if (!isValid(dt)) return '—';
  return format(dt, 'yyyy. MM. dd', { locale: ko });
}

export function hoi4RankLabel(index: number): string | null {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return null;
}

export function countUniqueHoi4Nations(
  leaderboard: Hoi4LeaderboardData['leaderboard'],
): number {
  const set = new Set<string>();
  for (const entry of leaderboard) {
    for (const nation of entry.nations) set.add(nation);
  }
  return set.size;
}

export function hoi4MemberGridClass(memberCount: number): string {
  return memberCount <= 4
    ? 'grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3'
    : 'grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 sm:gap-3';
}
