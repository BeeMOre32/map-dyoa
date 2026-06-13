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

/** 치지직 채널 ID — `/id`, `/live/id`, `/live/id/chat` 등 */
export function extractChzzkChannelId(url: string): string | null {
  try {
    const { hostname, pathname } = new URL(url);
    if (!hostname.includes('chzzk.naver.com')) return null;

    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return null;

    const liveIdx = segments.indexOf('live');
    if (liveIdx >= 0) {
      const afterLive = segments[liveIdx + 1];
      if (afterLive && afterLive !== 'chat') return afterLive;
    }

    const last = segments[segments.length - 1];
    if (!last || last === 'live' || last === 'chat' || last === 'clips') {
      return segments.length >= 2 ? segments[segments.length - 2] : null;
    }
    return last;
  } catch {
    return null;
  }
}

export function isChzzkClipUrl(url: string): boolean {
  return extractChzzkClipId(url) !== null;
}
