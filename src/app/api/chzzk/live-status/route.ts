import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export const revalidate = 0;

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
      where: { chzzkUrl: { not: null }, isGuest: false },
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
  const base = process.env.MAP_DYOA_SERVER_URL?.trim()?.replace(/\/$/, '');
  if (base) {
    try {
      const res = await fetch(`${base}/chzzk/live-status`, { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as { liveStreamerIds?: unknown[] };
        const liveStreamerIds = Array.isArray(data.liveStreamerIds)
          ? data.liveStreamerIds.map(String)
          : [];
        return NextResponse.json(
          { liveStreamerIds },
          { headers: { 'Cache-Control': 'no-store, max-age=0' } },
        );
      }
    } catch {
      // 백엔드 서버 호출 실패 시 로컬 Prisma 경로로 폴백
    }
  }

  const liveStreamerIds = await fetchLiveStreamerIds();
  return NextResponse.json(
    { liveStreamerIds },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  );
}
