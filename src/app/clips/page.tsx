import { getClipsPaginated, getClipMonths, getAllStreamers, getCalendarData, type ClipSortOption } from '@/lib/data-fetching';
import ClipView from '@/components/clips/ClipView';

const PAGE_SIZE = 20;
const VALID_SORTS: ClipSortOption[] = ['newest', 'oldest', 'date_desc', 'date_asc', 'title'];

export default async function ClipsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; streamer?: string; month?: string; q?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const streamerId = params.streamer ?? '';
  const month = params.month ?? '';
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
    <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950 transition-colors">
      <ClipView
        clips={clips}
        streamers={streamers}
        schedules={schedules}
        monthOptions={monthOptions}
        total={total}
        totalPages={totalPages}
        currentPage={page}
        currentFilters={{ streamerId, month, q, sort }}
      />
    </div>
  );
}
