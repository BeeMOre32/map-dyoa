import { NextResponse } from 'next/server';
import { toggleClipRecommendOnServer } from '@/lib/clip-week';

const HITS = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 30;

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

function allow(ip: string): boolean {
  const now = Date.now();
  const recent = (HITS.get(ip) ?? []).filter((stamp) => now - stamp < WINDOW_MS);
  if (recent.length >= LIMIT) {
    HITS.set(ip, recent);
    return false;
  }
  recent.push(now);
  HITS.set(ip, recent);
  return true;
}

export async function POST(request: Request) {
  if (!allow(clientIp(request))) {
    return NextResponse.json({ error: '잠시 후 다시 시도해 주세요.' }, { status: 429 });
  }

  let clipId = '';
  let voterId = '';
  try {
    const body = (await request.json()) as { clipId?: unknown; voterId?: unknown };
    clipId = typeof body.clipId === 'string' ? body.clipId.trim() : '';
    voterId = typeof body.voterId === 'string' ? body.voterId.trim() : '';
  } catch {
    return NextResponse.json({ error: 'JSON이 필요합니다.' }, { status: 400 });
  }
  if (!/^[a-z0-9]{8,64}$/i.test(clipId)) {
    return NextResponse.json({ error: '클립 정보가 올바르지 않습니다.' }, { status: 400 });
  }

  const result = await toggleClipRecommendOnServer(clipId, voterId);
  if (!result) {
    return NextResponse.json({ error: '추천을 저장하지 못했습니다.' }, { status: 502 });
  }
  if ('error' in result) {
    const status = result.error === 'BAD_VOTER' ? 400 : result.error === 'NOT_FOUND' ? 404 : 502;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json(result);
}
