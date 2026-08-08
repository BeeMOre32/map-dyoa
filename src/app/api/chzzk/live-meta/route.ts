import { NextRequest, NextResponse } from 'next/server';
import { extractChzzkChannelId } from '@/lib/chzzk';
import { fetchChzzkLiveDetail } from '@/lib/chzzk-api';
import { getPrismaForDomain } from '@/lib/prisma';
import { fetchWithBackoff } from '@/lib/map-dyoa-server-http-utils';
import { fetchAllStreamersFromServer } from '@/lib/map-dyoa-server-streamers';
import {
  getScheduleServerBaseUrl,
  isScheduleServerEnabled,
} from '@/lib/map-dyoa-server-schedules';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'url required' }, { status: 400 });
  }

  const base = getScheduleServerBaseUrl();
  if (base) {
    try {
      // Fly가 치지직 500을 502로 올릴 수 있음 → 짧게 시도 후 로컬 폴백
      const res = await fetchWithBackoff(
        `${base}/chzzk/live-meta?url=${encodeURIComponent(url)}`,
        { cache: 'no-store' },
        { maxRetries: 1, baseDelayMs: 200 },
      );
      if (res.ok) {
        const json = await res.json();
        return NextResponse.json(json);
      }
    } catch {
      // 서버 호출 실패 시 로컬 폴백
    }
  }

  const channelId = extractChzzkChannelId(url);
  if (!channelId) {
    return NextResponse.json({ error: '유효한 치지직 URL이 아닙니다.' }, { status: 400 });
  }

  try {
    const streamerPromise = isScheduleServerEnabled()
      ? fetchAllStreamersFromServer(false).then((rows) => {
          const s = rows.find((r) => r.chzzkUrl?.includes(channelId));
          return s ? { id: s.id, name: s.name } : null;
        })
      : getPrismaForDomain().streamer.findFirst({
          where: { chzzkUrl: { contains: channelId } },
          select: { id: true, name: true },
        });

    const [content, streamer] = await Promise.all([
      fetchChzzkLiveDetail(channelId),
      streamerPromise,
    ]);

    return NextResponse.json({
      title: content?.liveTitle ?? null,
      category: content?.liveCategory ?? null,
      channelName: content?.channel?.channelName ?? null,
      matchedStreamerId: streamer?.id ?? null,
      matchedStreamerName: streamer?.name ?? null,
    });
  } catch {
    return NextResponse.json({ error: '요청 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
