import { NextResponse } from 'next/server';
import { getLiveStreamerIds } from '@/lib/chzzk-live-status';

export const dynamic = 'force-dynamic';

export async function GET() {
  const fetchedAt = Date.now();
  const liveStreamerIds = await getLiveStreamerIds({ fresh: true });
  return NextResponse.json(
    { liveStreamerIds, fetchedAt },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  );
}
