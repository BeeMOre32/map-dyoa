import { NextRequest, NextResponse } from 'next/server';
import { extractChzzkClipId } from '@/lib/chzzk';
import { fetchWithBackoff } from '@/lib/map-dyoa-server-http-utils';
import { getScheduleServerBaseUrl } from '@/lib/map-dyoa-server-schedules';

function findCoverUrl(obj: unknown): string | null {
  if (!obj || typeof obj !== 'object') return null;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findCoverUrl(item);
      if (found) return found;
    }
    return null;
  }
  const record = obj as Record<string, unknown>;
  if ('cover' in record && Array.isArray(record.cover) && record.cover.length > 0) {
    const first = record.cover[0] as Record<string, unknown>;
    if (typeof first?.value === 'string' && first.value.startsWith('http')) {
      return first.value;
    }
  }
  for (const val of Object.values(record)) {
    const found = findCoverUrl(val);
    if (found) return found;
  }
  return null;
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'url 파라미터가 필요합니다.' }, { status: 400 });
  }

  const base = getScheduleServerBaseUrl();
  if (base) {
    try {
      const res = await fetchWithBackoff(`${base}/chzzk/clip-meta?url=${encodeURIComponent(url)}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    } catch {
      // 서버 호출 실패 시 로컬 폴백
    }
  }

  const clipId = extractChzzkClipId(url);
  if (!clipId) {
    return NextResponse.json({ error: '유효한 치지직 클립 URL이 아닙니다.' }, { status: 400 });
  }

  try {
    // Step 1: play-info 로 videoId, inKey 가져오기 (인증 불필요)
    const playInfoRes = await fetch(
      `https://api.chzzk.naver.com/service/v1/play-info/clip/${clipId}`,
      { headers: { 'User-Agent': UA }, next: { revalidate: 3600 } },
    );

    if (!playInfoRes.ok) {
      return NextResponse.json({ error: `play-info 오류: ${playInfoRes.status}` }, { status: 502 });
    }

    const playInfo = await playInfoRes.json();
    const content = playInfo?.content;
    const videoId: string | null = content?.videoId ?? null;
    const inKey: string | null = content?.inKey ?? null;
    const title: string | null = content?.contentTitle ?? null;

    if (!videoId || !inKey) {
      return NextResponse.json({ error: '클립 정보를 가져올 수 없습니다.' }, { status: 502 });
    }

    // Step 2: VOD 플레이백으로 썸네일 가져오기
    const vodUrl =
      `https://apis.naver.com/neonplayer/vodplay/v1/playback/${videoId}` +
      `?key=${encodeURIComponent(inKey)}&sid=2208832&lang=ko_KR&connectType=PC` +
      `&playerType=HTML5_FLASH&videoId=${videoId}&playType=CLIP`;

    const vodRes = await fetch(vodUrl, {
      headers: { 'User-Agent': UA },
      next: { revalidate: 3600 },
    });

    if (!vodRes.ok) {
      return NextResponse.json({ thumbnailUrl: null, title });
    }

    const vodData = await vodRes.json();
    const thumbnailUrl = findCoverUrl(vodData);

    return NextResponse.json({ thumbnailUrl, title });
  } catch {
    return NextResponse.json({ error: '요청 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
