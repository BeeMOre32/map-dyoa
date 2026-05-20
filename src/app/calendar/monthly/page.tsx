import MonthlyStatsView from '@/components/Calendar/MonthlyStatsView';
import { getAllClips, getCalendarData, getClipsPaginated, getPublicSiteOverview } from '@/lib/data-fetching';
import { computeMonthlyClipStats, formatMonthParam, resolveMonthlyStatsMonth } from '@/lib/monthlyClipStats';
import { computeExtendedSiteContentStats } from '@/lib/siteStats';
import { computeSiteWideReport } from '@/lib/siteWideStats';
import { buildPageMetadata } from '@/lib/site';

export const metadata = buildPageMetadata({
  title: '사이트 통계',
  description:
    'Map-Dyoa 사이트 전체·월간 통계. TOP 멤버·게임, 월별 추이, 클립·일정 누적 데이터를 JSON으로 내보낼 수 있습니다.',
  path: '/calendar/monthly',
});

export default async function MonthlyStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const month = resolveMonthlyStatsMonth(monthParam);
  const monthKey = formatMonthParam(month);

  const [{ schedules, streamers, games }, siteOverview, allClips, clipResult] =
    await Promise.all([
      getCalendarData(),
      getPublicSiteOverview(),
      getAllClips(),
      getClipsPaginated({
        month: monthKey,
        page: 1,
        pageSize: 200,
        sort: 'newest',
      }),
    ]);

  const siteReport = computeSiteWideReport({
    schedules,
    clips: allClips,
    streamers,
    games,
    overview: siteOverview,
  });

  const clipStats = computeMonthlyClipStats(clipResult.clips, clipResult.total);
  const contentStats = computeExtendedSiteContentStats({
    schedules,
    clips: allClips,
    memberCount: streamers.filter((s) => !s.isGuest).length,
    gameCount: games.length,
    guestStreamerCount: streamers.filter((s) => s.isGuest).length,
    clipCountTotal: siteOverview.clipCount,
  });
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto custom-scrollbar bg-slate-50/80 dark:bg-slate-950">
      <MonthlyStatsView
        initialSchedules={schedules}
        streamers={streamers}
        games={games}
        initialMonth={monthKey}
        siteOverview={siteOverview}
        contentStats={contentStats}
        clipStats={clipStats}
        siteReport={siteReport}
      />
    </div>
  );
}
