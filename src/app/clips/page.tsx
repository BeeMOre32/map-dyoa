import { getClipsPaginated, getClipMonths, getAllStreamers, getCalendarData, type ClipSortOption } from '@/lib/data-fetching';
import ClipView from '@/components/clips/ClipView';
import { buildPageMetadata } from '@/lib/site';

export const metadata = buildPageMetadata({
  title: '클립',
  description: '지도동 방송 클립을 스트리머·월별로 검색하고 시청하세요.',
  path: '/clips',
});

const PAGE_SIZE = 20;
const VALID_SORTS: ClipSortOption[] = ['newest', 'oldest', 'date_desc', 'date_asc', 'title'];
const CLIP_MONTH_PARAM = /^\d{4}-\d{2}$/;

export default async function ClipsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    streamer?: string;
    streamers?: string;
    favorites?: string;
    month?: string;
    q?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const streamerIds = (params.streamers ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const streamerId =
    streamerIds.length === 1 ? streamerIds[0] : (params.streamer ?? '');
  const favoritesOnly =
    params.favorites === '1' || params.favorites === 'true';
  const rawMonth = params.month ?? '';
  const month = CLIP_MONTH_PARAM.test(rawMonth) ? rawMonth : '';
  const q = params.q ?? '';
  const sort: ClipSortOption = VALID_SORTS.includes(params.sort as ClipSortOption)
    ? (params.sort as ClipSortOption)
    : 'newest';

  const calendarData = await getCalendarData();
  const [{ clips, total, totalPages }, streamers, monthOptions] = await Promise.all([
    getClipsPaginated({
      page,
      pageSize: PAGE_SIZE,
      streamerId: streamerId || undefined,
      streamerIds: streamerIds.length > 1 ? streamerIds : undefined,
      month: month || undefined,
      q: q || undefined,
      sort,
      schedulesForClipLinks: calendarData.schedules,
    }),
    getAllStreamers(),
    getClipMonths(),
  ]);
  const { schedules } = calendarData;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-slate-50/50 p-2 transition-colors dark:bg-slate-950 sm:p-4">
      <ClipView
        clips={clips}
        streamers={streamers}
        schedules={schedules}
        monthOptions={monthOptions}
        total={total}
        totalPages={totalPages}
        currentPage={page}
        currentFilters={{ streamerId, month, q, sort, favoritesOnly }}
      />
    </div>
  );
}
