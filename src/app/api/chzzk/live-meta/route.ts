import { NextRequest, NextResponse } from 'next/server';
import { extractChzzkChannelId } from '@/lib/chzzk';
import {
  chzzkLiveThumbnailUrl,
  fetchChzzkLiveDetail,
  isChzzkChannelLive,
} from '@/lib/chzzk-api';
import { getPrismaForDomain } from '@/lib/prisma';
import { fetchWithBackoff } from '@/lib/map-dyoa-server-http-utils';
import { fetchAllStreamersFromServer } from '@/lib/map-dyoa-server-streamers';
import {
  getScheduleServerBaseUrl,
  isScheduleServerEnabled,
} from '@/lib/map-dyoa-server-schedules';

async function findMatchedStreamer(channelId: string) {
  if (isScheduleServerEnabled()) {
    const rows = await fetchAllStreamersFromServer(false);
    const s = rows.find((r) => r.chzzkUrl?.includes(channelId));
    return s ? { id: s.id, name: s.name } : null;
  }
  return getPrismaForDomain().streamer.findFirst({
    where: { chzzkUrl: { contains: channelId } },
    select: { id: true, name: true },
  });
}

/** Fly live-meta는 title·category·channelName·matched*만 준다. */
async function fetchFromFly(url: string): Promise<Record<string, unknown> | null> {
  const base = getScheduleServerBaseUrl();
  if (!base) return null;
  try {
    const res = await fetchWithBackoff(
      `${base}/chzzk/live-meta?url=${encodeURIComponent(url)}`,
      { cache: 'no-store' },
      { maxRetries: 1, baseDelayMs: 200 },
    );
    return res.ok ? ((await res.json()) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'url required' }, { status: 400 });
  }

  const channelId = extractChzzkChannelId(url);
  if (!channelId) {
    const fly = await fetchFromFly(url);
    if (fly) return NextResponse.json(fly);
    return NextResponse.json({ error: '유효한 치지직 URL이 아닙니다.' }, { status: 400 });
  }

  try {
    const [content, streamer] = await Promise.all([
      fetchChzzkLiveDetail(channelId),
      findMatchedStreamer(channelId).catch(() => null),
    ]);

    if (!content) {
      const fly = await fetchFromFly(url);
      if (fly) return NextResponse.json(fly);
    }

    const isLive = isChzzkChannelLive(content);
    return NextResponse.json({
      title: content?.liveTitle ?? null,
      category: content?.liveCategory ?? null,
      categoryValue: content?.liveCategoryValue ?? null,
      channelName: content?.channel?.channelName ?? null,
      isLive,
      // 방송 종료 후에도 마지막 방송 값이 남아 있다
      viewerCount: isLive ? (content?.concurrentUserCount ?? null) : null,
      thumbnailUrl: isLive ? chzzkLiveThumbnailUrl(content, 720) : null,
      matchedStreamerId: streamer?.id ?? null,
      matchedStreamerName: streamer?.name ?? null,
    });
  } catch {
    return NextResponse.json({ error: '요청 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
