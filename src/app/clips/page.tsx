import { getClipsPaginated, getClipMonths, getAllStreamers, getCalendarData } from '@/lib/data-fetching';
import ClipView from '@/components/clips/ClipView';

const PAGE_SIZE = 20;

export default async function ClipsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; streamer?: string; month?: string; q?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const streamerId = params.streamer ?? '';
  const month = params.month ?? '';
  const q = params.q ?? '';

  const [{ clips, total, totalPages }, streamers, { schedules }, monthOptions] = await Promise.all([
    getClipsPaginated({
      page,
      pageSize: PAGE_SIZE,
      streamerId: streamerId || undefined,
      month: month || undefined,
      q: q || undefined,
    }),
    getAllStreamers(),
    getCalendarData(),
    getClipMonths(),
  ]);

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
        currentFilters={{ streamerId, month, q }}
      />
    </div>
  );
}
