import { format, isValid, parse, startOfMonth } from 'date-fns';
import type { ClipWithParticipants } from '@/types/entities';
import type { MonthlyRankedItem } from '@/lib/monthlyWrappedStats';

export type MonthlyClipStats = {
  count: number;
  topStreamers: MonthlyRankedItem[];
};

function toClipStreamerRanked(
  clips: ClipWithParticipants[],
  limit = 5,
): MonthlyRankedItem[] {
  const counts = new Map<string, { name: string; count: number }>();

  for (const clip of clips) {
    for (const participant of clip.participants) {
      if (participant.streamer.isGuest) continue;
      const current = counts.get(participant.streamer.id);
      if (current) current.count += 1;
      else {
        counts.set(participant.streamer.id, {
          name: participant.streamer.name,
          count: 1,
        });
      }
    }
  }

  const sorted = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, limit);
  const max = sorted[0]?.count ?? 0;
  return sorted.map((entry) => ({
    name: entry.name,
    count: entry.count,
    pct: max > 0 ? Math.round((entry.count / max) * 100) : 0,
  }));
}

export function computeMonthlyClipStats(
  clips: ClipWithParticipants[],
  total: number,
): MonthlyClipStats {
  return {
    count: total,
    topStreamers: toClipStreamerRanked(clips),
  };
}

export function resolveMonthlyStatsMonth(initialMonth?: string): Date {
  if (initialMonth) {
    const parsed = parse(initialMonth, 'yyyy-MM', new Date());
    if (isValid(parsed)) return startOfMonth(parsed);
  }
  return startOfMonth(new Date());
}

export function formatMonthParam(month: Date): string {
  return format(month, 'yyyy-MM');
}
