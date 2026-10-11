import { NextResponse } from 'next/server';
import { fetchLiveChannels } from '@/lib/chzzk-live-status';

export const dynamic = 'force-dynamic';

export async function GET() {
  const fetchedAt = Date.now();
  const channels = await fetchLiveChannels();
  const liveStreamerIds = channels.map((c) => c.streamerId);
  const viewerCounts: Record<string, number> = {};
  for (const c of channels) {
    const count = c.status.concurrentUserCount;
    if (typeof count === 'number') viewerCounts[c.streamerId] = count;
  }
  return NextResponse.json(
    { liveStreamerIds, viewerCounts, fetchedAt },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  );
}
