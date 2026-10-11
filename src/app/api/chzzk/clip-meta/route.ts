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

type ClipMetaBody = { thumbnailUrl: string | null; title: string | null };

function parseClipMeta(json: unknown): ClipMetaBody | null {
  if (!json || typeof json !== 'object') return null;
  const rec = json as Record<string, unknown>;
  const thumbnailUrl =
    typeof rec.thumbnailUrl === 'string' && rec.thumbnailUrl.startsWith('http')
      ? rec.thumbnailUrl
      : null;
  const title = typeof rec.title === 'string' && rec.title.trim() ? rec.title : null;
  if (!thumbnailUrl && !title) return null;
  return { thumbnailUrl, title };
}

/** play-info + neonplayer. 썸네일까지 있으면 성공, 제목만 있으면 부분 성공. */
async function fetchClipMetaDirect(clipId: string): Promise<ClipMetaBody | null> {
  const playInfoRes = await fetch(
    `https://api.chzzk.naver.com/service/v1/play-info/clip/${clipId}`,
    { headers: { 'User-Agent': UA }, next: { revalidate: 3600 } },
  );
  if (!playInfoRes.ok) return null;

  const playInfo = await playInfoRes.json();
  const content = playInfo?.content;
  const videoId: string | null = content?.videoId ?? null;
  const inKey: string | null = content?.inKey ?? null;
  const title: string | null = content?.contentTitle ?? null;
  if (!videoId || !inKey) return null;

  const vodUrl =
    `https://apis.naver.com/neonplayer/vodplay/v1/playback/${videoId}` +
    `?key=${encodeURIComponent(inKey)}&sid=2208832&lang=ko_KR&connectType=PC` +
    `&playerType=HTML5_FLASH&videoId=${videoId}&playType=CLIP`;

  const vodRes = await fetch(vodUrl, {
    headers: { 'User-Agent': UA },
    next: { revalidate: 3600 },
  });
  if (!vodRes.ok) return { thumbnailUrl: null, title };

  const thumbnailUrl = findCoverUrl(await vodRes.json());
  return { thumbnailUrl, title };
}

async function fetchClipMetaFromFly(url: string): Promise<ClipMetaBody | null> {
  const base = getScheduleServerBaseUrl();
  if (!base) return null;
  try {
    const res = await fetchWithBackoff(
      `${base}/chzzk/clip-meta?url=${encodeURIComponent(url)}`,
      { cache: 'no-store' },
      { maxRetries: 1, baseDelayMs: 200 },
    );
    if (!res.ok) return null;
    return parseClipMeta(await res.json());
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'url 파라미터가 필요합니다.' }, { status: 400 });
  }

  const clipId = extractChzzkClipId(url);
  let direct: ClipMetaBody | null = null;
  if (clipId) {
    try {
      direct = await fetchClipMetaDirect(clipId);
    } catch {
      direct = null;
    }
  }

  if (direct?.thumbnailUrl) {
    return NextResponse.json(direct);
  }

  const fly = await fetchClipMetaFromFly(url);
  if (fly?.thumbnailUrl) {
    return NextResponse.json({
      thumbnailUrl: fly.thumbnailUrl,
      title: direct?.title ?? fly.title,
    });
  }
  if (direct) return NextResponse.json(direct);
  if (fly) return NextResponse.json(fly);

  if (!clipId) {
    return NextResponse.json({ error: '유효한 치지직 클립 URL이 아닙니다.' }, { status: 400 });
  }
  return NextResponse.json({ error: '클립 정보를 가져올 수 없습니다.' }, { status: 502 });
}
