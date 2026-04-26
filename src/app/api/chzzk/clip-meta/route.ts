import { NextRequest, NextResponse } from 'next/server';

function extractClipId(url: string): string | null {
  try {
    const { pathname } = new URL(url);
    const match = pathname.match(/^\/clips\/([A-Za-z0-9_-]+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'url 파라미터가 필요합니다.' }, { status: 400 });
  }

  const clipId = extractClipId(url);
  if (!clipId) {
    return NextResponse.json({ error: '유효한 치지직 클립 URL이 아닙니다.' }, { status: 400 });
  }

  // 치지직 클립 API는 로그인 세션이 있어야만 접근 가능 (공개 API 없음)
  return NextResponse.json(
    { error: '치지직 클립은 인증된 세션이 필요해 자동 추출이 불가합니다.' },
    { status: 501 },
  );
}
