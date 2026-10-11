import { NextResponse } from 'next/server';
import { fetchLiveChannels } from '@/lib/chzzk-live-status';

export const dynamic = 'force-dynamic';

export async function GET() {
  const fetchedAt = Date.now();
  const channels = await fetchLiveChannels();
  const liveStreamerIds = channels.map((c) => c.streamerId);
  const viewerCounts: Record<string, number> = {};
  const liveChannels = channels.map((c) => {
    const count = c.status.concurrentUserCount;
    if (typeof count === 'number') viewerCounts[c.streamerId] = count;
    return {
      streamerId: c.streamerId,
      liveTitle: c.status.liveTitle?.trim() ?? '',
      openDate: c.status.openDate ?? null,
      category: c.status.liveCategoryValue?.trim() || c.status.liveCategory?.trim() || null,
    };
  });
  return NextResponse.json(
    { liveStreamerIds, viewerCounts, liveChannels, fetchedAt },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  );
}
