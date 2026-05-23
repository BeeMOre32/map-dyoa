import { format, parse } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Game, Streamer } from '@prisma/client';
import type { PublicSiteOverview } from '@/lib/data-fetching';
import {
  computeMonthlyWrappedStats,
  type MonthlyRankedItem,
} from '@/lib/monthlyWrappedStats';
import { groupSchedulesByDate, type FlattenedSchedule } from '@/lib/schedule-formatters';
import type { ClipWithParticipants } from '@/types/entities';
import {
  computeExtendedSiteContentStats,
  type ExtendedSiteContentStats,
} from '@/lib/siteStats';

export type SiteMonthlyTrendRow = {
  month: string;
  label: string;
  scheduleCount: number;
  clipCount: number;
  activeDays: number;
  uniqueStreamers: number;
};

export type SiteWideReport = {
  generatedAt: string;
  siteName: string;
  dataRange: {
    scheduleFrom: string | null;
    scheduleTo: string | null;
    clipFrom: string | null;
    clipTo: string | null;
  };
  overview: PublicSiteOverview;
  content: ExtendedSiteContentStats;
  topStreamersAllTime: MonthlyRankedItem[];
  topGamesAllTime: MonthlyRankedItem[];
  monthlyTrend: SiteMonthlyTrendRow[];
  notes: string[];
};

function clipMonthKey(clip: ClipWithParticipants): string | null {
  const d = new Date(clip.clipDate ?? clip.createdAt);
  if (!Number.isFinite(d.getTime())) return null;
  return format(d, 'yyyy-MM');
}

function toRankedFromMap(
  entries: Map<string, { name: string; count: number }>,
  limit = 10,
): MonthlyRankedItem[] {
  const sorted = [...entries.values()].sort((a, b) => b.count - a.count).slice(0, limit);
  const max = sorted[0]?.count ?? 0;
  return sorted.map((entry) => ({
    name: entry.name,
    count: entry.count,
    pct: max > 0 ? Math.round((entry.count / max) * 100) : 0,
  }));
}

function collectMonthKeys(schedules: FlattenedSchedule[], clips: ClipWithParticipants[]): string[] {
  const keys = new Set<string>();
  for (const schedule of schedules) {
    const d = new Date(schedule.startTime);
    if (Number.isFinite(d.getTime())) keys.add(format(d, 'yyyy-MM'));
  }
  for (const clip of clips) {
    const key = clipMonthKey(clip);
    if (key) keys.add(key);
  }
  return [...keys].sort((a, b) => b.localeCompare(a));
}

function clipCountsByMonth(clips: ClipWithParticipants[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const clip of clips) {
    const key = clipMonthKey(clip);
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

function computeAllTimeRankings(schedules: FlattenedSchedule[]) {
  const streamers = new Map<string, { name: string; count: number }>();
  const games = new Map<string, { name: string; count: number }>();

  for (const schedule of schedules) {
    for (const p of schedule.participants) {
      if (p.isGuest) continue;
      const cur = streamers.get(p.id);
      if (cur) cur.count += 1;
      else streamers.set(p.id, { name: p.name, count: 1 });
    }
    if (schedule.game) {
      const cur = games.get(schedule.game.id);
      if (cur) cur.count += 1;
      else games.set(schedule.game.id, { name: schedule.game.title, count: 1 });
    }
  }

  return {
    topStreamersAllTime: toRankedFromMap(streamers, 10),
    topGamesAllTime: toRankedFromMap(games, 10),
  };
}

function scheduleDateRange(schedules: FlattenedSchedule[]) {
  let min: Date | null = null;
  let max: Date | null = null;
  for (const s of schedules) {
    const d = new Date(s.startTime);
    if (!Number.isFinite(d.getTime())) continue;
    if (!min || d < min) min = d;
    if (!max || d > max) max = d;
  }
  return {
    from: min ? format(min, 'yyyy-MM-dd') : null,
    to: max ? format(max, 'yyyy-MM-dd') : null,
  };
}

function clipDateRange(clips: ClipWithParticipants[]) {
  let min: Date | null = null;
  let max: Date | null = null;
  for (const c of clips) {
    const d = new Date(c.clipDate ?? c.createdAt);
    if (!Number.isFinite(d.getTime())) continue;
    if (!min || d < min) min = d;
    if (!max || d > max) max = d;
  }
  return {
    from: min ? format(min, 'yyyy-MM-dd') : null,
    to: max ? format(max, 'yyyy-MM-dd') : null,
  };
}

export function computeSiteWideReport(input: {
  schedules: FlattenedSchedule[];
  clips: ClipWithParticipants[];
  streamers: Streamer[];
  games: Game[];
  overview: PublicSiteOverview;
}): SiteWideReport {
  const { schedules, clips, streamers, games, overview } = input;
  const members = streamers.filter((s) => !s.isGuest);
  const schedulesByDate = groupSchedulesByDate(schedules);
  const clipsByMonth = clipCountsByMonth(clips);
  const monthKeys = collectMonthKeys(schedules, clips);

  const monthlyTrend: SiteMonthlyTrendRow[] = monthKeys.map((monthKey) => {
    const monthDate = parse(`${monthKey}-01`, 'yyyy-MM-dd', new Date());
    const stats = computeMonthlyWrappedStats(schedulesByDate, monthDate);
    return {
      month: monthKey,
      label: format(monthDate, 'yyyy년 M월', { locale: ko }),
      scheduleCount: stats.scheduleCount,
      clipCount: clipsByMonth.get(monthKey) ?? 0,
      activeDays: stats.activeDays,
      uniqueStreamers: stats.uniqueStreamers,
    };
  });

  const { topStreamersAllTime, topGamesAllTime } = computeAllTimeRankings(schedules);
  const scheduleRange = scheduleDateRange(schedules);
  const clipRange = clipDateRange(clips);

  const content = computeExtendedSiteContentStats({
    schedules,
    clips,
    memberCount: members.length,
    gameCount: games.length,
    guestStreamerCount: streamers.filter((s) => s.isGuest).length,
    clipCountTotal: overview.clipCount,
  });

  const notes = [
    '콘텐츠 통계는 DB에 등록된 일정·클립·멤버·게임 기준입니다.',
    '월별 클립 수는 샘플 클립 목록 기준일 수 있으며, overview.clipCount가 전체 클립 수입니다.',
  ];

  if (overview.scheduleCount !== schedules.length) {
    notes.unshift(
      '등록 일정 overview는 전체 DB count, 상세 breakdown은 캘린더 조회 구간 일정 기준일 수 있습니다.',
    );
  }

  return {
    generatedAt: new Date().toISOString(),
    siteName: '지도동',
    dataRange: {
      scheduleFrom: scheduleRange.from,
      scheduleTo: scheduleRange.to,
      clipFrom: clipRange.from,
      clipTo: clipRange.to,
    },
    overview,
    content,
    topStreamersAllTime,
    topGamesAllTime,
    monthlyTrend,
    notes,
  };
}

export function buildSiteStatsExportBlob(report: SiteWideReport): Blob {
  return new Blob([JSON.stringify(report, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
}

export function downloadSiteStatsExport(report: SiteWideReport) {
  const blob = buildSiteStatsExportBlob(report);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `map-dyoa-site-stats-${format(new Date(), 'yyyy-MM-dd')}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
