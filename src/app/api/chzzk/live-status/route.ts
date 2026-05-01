import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

function extractChannelId(url: string): string | null {
  try {
    const segments = new URL(url).pathname.split('/').filter(Boolean);
    return segments[segments.length - 1] ?? null;
  } catch {
    return null;
  }
}

const fetchLiveStreamerIds = unstable_cache(
  async (): Promise<string[]> => {
    const streamers = await prisma.streamer.findMany({
      select: { id: true, chzzkUrl: true },
      where: { chzzkUrl: { not: null } },
    });

    const results = await Promise.all(
      streamers.map(async (s) => {
        const channelId = extractChannelId(s.chzzkUrl!);
        if (!channelId) return null;

        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4000);
          const res = await fetch(
            `https://api.chzzk.naver.com/service/v2/channels/${channelId}/live-detail`,
            { headers: { 'User-Agent': 'Mozilla/5.0' }, cache: 'no-store', signal: controller.signal },
          );
          clearTimeout(timer);
          if (!res.ok) return null;
          const json = await res.json();
          return json?.content?.status === 'OPEN' ? s.id : null;
        } catch {
          return null;
        }
      }),
    );

    return results.filter((id): id is string => id !== null);
  },
  ['chzzk-live-status'],
  { revalidate: 60 },
);

export async function GET() {
  const liveStreamerIds = await fetchLiveStreamerIds();
  return NextResponse.json({ liveStreamerIds });
}
