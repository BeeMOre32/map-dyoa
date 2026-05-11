import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchWithBackoff } from '@/lib/map-dyoa-server-http-utils';
import { getScheduleServerBaseUrl } from '@/lib/map-dyoa-server-schedules';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function extractChannelId(url: string): string | null {
  try {
    const { hostname, pathname } = new URL(url);
    if (!hostname.includes('chzzk.naver.com')) return null;
    // /live/{channelId}  또는  /{channelId}
    const segments = pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (!last || last === 'live') return null;
    return last;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'url required' }, { status: 400 });
  }

  const base = getScheduleServerBaseUrl();
  if (base) {
    try {
      const res = await fetchWithBackoff(`${base}/chzzk/live-meta?url=${encodeURIComponent(url)}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    } catch {
      // 서버 호출 실패 시 로컬 폴백
    }
  }

  const channelId = extractChannelId(url);
  if (!channelId) {
    return NextResponse.json({ error: '유효한 치지직 URL이 아닙니다.' }, { status: 400 });
  }

  try {
    const [liveRes, streamer] = await Promise.all([
      fetch(
        `https://api.chzzk.naver.com/service/v2/channels/${channelId}/live-detail`,
        { headers: { 'User-Agent': UA }, cache: 'no-store' },
      ),
      prisma.streamer.findFirst({
        where: { chzzkUrl: { contains: channelId } },
        select: { id: true, name: true },
      }),
    ]);

    if (!liveRes.ok) {
      return NextResponse.json({ error: `CHZZK API 오류: ${liveRes.status}` }, { status: 502 });
    }

    const json = await liveRes.json();
    const content = json?.content ?? null;

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
