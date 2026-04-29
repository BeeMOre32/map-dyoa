import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'url 파라미터가 필요합니다.' }, { status: 400 });
  }

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return NextResponse.json({ error: '메타데이터를 가져올 수 없습니다.' }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json({
      title: data.title ?? null,
      thumbnailUrl: data.thumbnail_url ?? null,
    });
  } catch {
    return NextResponse.json({ error: '요청 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
