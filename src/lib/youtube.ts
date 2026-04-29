export function extractYouTubeVideoId(url: string): string | null {
  try {
    const { hostname, pathname, searchParams } = new URL(url);
    if (hostname === 'youtu.be') {
      return pathname.slice(1).split('/')[0] || null;
    }
    if (hostname === 'www.youtube.com' || hostname === 'youtube.com') {
      if (pathname.startsWith('/shorts/')) {
        return pathname.split('/shorts/')[1]?.split('/')[0] || null;
      }
      return searchParams.get('v');
    }
    return null;
  } catch {
    return null;
  }
}

export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeVideoId(url) !== null;
}
