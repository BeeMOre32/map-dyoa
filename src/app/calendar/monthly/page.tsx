import MonthlyStatsView from '@/components/Calendar/MonthlyStatsView';
import { getAllClips, getCalendarData, getClipsPaginated, getPublicSiteOverview } from '@/lib/data-fetching';
import { computeMonthlyClipStats, formatMonthParam, resolveMonthlyStatsMonth } from '@/lib/monthlyClipStats';
import { computeExtendedSiteContentStats } from '@/lib/siteStats';
import { computeSiteWideReport } from '@/lib/siteWideStats';
import { buildPageMetadata } from '@/lib/site';

export const metadata = buildPageMetadata({
  title: '통계',
  description:
    '지도동 합방·일정·클립 누적 통계, 월별 Wrapped, TOP 멤버·게임, 월별 추이를 확인하세요.',
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
      <header className="sr-only">
        <h1>지도동 방송 통계</h1>
        <p>지도동 멤버 합방·일정·클립 누적 데이터와 월별 통계입니다.</p>
      </header>
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
