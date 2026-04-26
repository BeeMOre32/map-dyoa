export function extractChzzkClipId(url: string): string | null {
  try {
    const { hostname, pathname } = new URL(url);
    if (hostname !== 'chzzk.naver.com') return null;
    const match = pathname.match(/^\/clips\/([A-Za-z0-9_-]+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function isChzzkClipUrl(url: string): boolean {
  return extractChzzkClipId(url) !== null;
}
