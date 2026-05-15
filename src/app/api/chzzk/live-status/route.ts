import { NextResponse } from 'next/server';
import { getLiveStreamerIds } from '@/lib/chzzk-live-status';

export const revalidate = 0;

export async function GET() {
  const liveStreamerIds = await getLiveStreamerIds();
  return NextResponse.json(
    { liveStreamerIds },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  );
}
