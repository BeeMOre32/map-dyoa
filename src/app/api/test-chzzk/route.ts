import { NextResponse } from 'next/server';
import { isScheduleServerEnabled } from '@/lib/map-dyoa-server-schedules';
import { getPrismaForDomain } from '@/lib/prisma';

function extractChannelId(chzzkUrl: string): string | null {
  try {
    const url = new URL(chzzkUrl);
    const segments = url.pathname.split('/').filter(Boolean);
    return segments[segments.length - 1] ?? null;
  } catch {
    return null;
  }
}

async function fetchLiveStatus(channelId: string) {
  const res = await fetch(
    `https://api.chzzk.naver.com/service/v2/channels/${channelId}/live-detail`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      cache: 'no-store',
    },
  );
  return res.json();
}

export async function GET() {
  if (process.env.NODE_ENV === 'production' || isScheduleServerEnabled()) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const streamers = await getPrismaForDomain().streamer.findMany({
    select: { id: true, name: true, chzzkUrl: true },
    where: { chzzkUrl: { not: null } },
  });

  const channelMap = new Map<string, string>();
  for (const s of streamers) {
    const cid = extractChannelId(s.chzzkUrl!);
    if (cid) channelMap.set(cid, s.name);
  }

  const results = await Promise.all(
    [...channelMap.entries()].map(async ([channelId, name]) => {
      const json = await fetchLiveStatus(channelId);
      const content = json?.content;
      const isLive = content?.status === 'OPEN';
      return {
        name,
        channelId,
        isLive,
        liveTitle: isLive ? content.liveTitle : null,
        viewers: isLive ? content.concurrentUserCount : null,
        openDate: isLive ? content.openDate : null,
      };
    }),
  );

  const liveNow = results.filter((r) => r.isLive);
  const offline = results.filter((r) => !r.isLive).map((r) => r.name);

  return NextResponse.json({
    liveCount: liveNow.length,
    liveNow,
    offline,
  });
}
