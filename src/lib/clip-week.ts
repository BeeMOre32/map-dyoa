import { MapDyoaServerRequestFailedError } from '@/lib/map-dyoa-server-client-error';
import { fetchWithBackoff, readJsonSafely } from '@/lib/map-dyoa-server-fetch';
import { getScheduleServerBaseUrl } from '@/lib/map-dyoa-server-schedules';

export type ClipWeekRecommendRow = {
  clipId: string;
  recommends: number;
  weekRecommends: number;
  title: string;
  url: string;
  thumbnailUrl: string | null;
  clipDate: string | null;
  streamers: string[];
};

function asRow(raw: unknown): ClipWeekRecommendRow | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const clipId = typeof row.clipId === 'string' ? row.clipId : '';
  const title = typeof row.title === 'string' ? row.title : '';
  const url = typeof row.url === 'string' ? row.url : '';
  const recommends = typeof row.recommends === 'number' ? row.recommends : 0;
  const weekRecommends = typeof row.weekRecommends === 'number' ? row.weekRecommends : 0;
  if (!clipId || !title || !url) return null;
  const streamers = Array.isArray(row.streamers)
    ? row.streamers.filter((name): name is string => typeof name === 'string' && name.length > 0)
    : [];
  return {
    clipId,
    recommends,
    weekRecommends,
    title,
    url,
    thumbnailUrl: typeof row.thumbnailUrl === 'string' ? row.thumbnailUrl : null,
    clipDate: typeof row.clipDate === 'string' ? row.clipDate : null,
    streamers,
  };
}

export async function listClipWeekRecommends(limit = 20): Promise<ClipWeekRecommendRow[]> {
  const base = getScheduleServerBaseUrl();
  if (!base) return [];
  try {
    const res = await fetchWithBackoff(`${base}/clips/week-recommends?limit=${limit}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await readJsonSafely<{ clips?: unknown[] }>(res, '주간 추천');
    if (!Array.isArray(data.clips)) return [];
    return data.clips.flatMap((raw) => {
      const row = asRow(raw);
      return row ? [row] : [];
    });
  } catch (error) {
    console.error('[clip-week] list', error);
    return [];
  }
}

export async function toggleClipRecommendOnServer(
  clipId: string,
  voterId: string,
): Promise<{ recommends: number; recommended: boolean } | { error: string } | null> {
  const base = getScheduleServerBaseUrl();
  if (!base) return null;
  try {
    const res = await fetchWithBackoff(
      `${base}/clips/${encodeURIComponent(clipId)}/recommend`,
      {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterId }),
      },
      { maxRetries: 0 },
    );
    const data = await readJsonSafely<{
      recommends?: unknown;
      recommended?: unknown;
    }>(res, '클립 추천');
    if (typeof data.recommends !== 'number' || typeof data.recommended !== 'boolean') return null;
    return { recommends: data.recommends, recommended: data.recommended };
  } catch (error) {
    if (error instanceof MapDyoaServerRequestFailedError) {
      return { error: error.serverErrorCode ?? 'FAILED' };
    }
    console.error('[clip-recommend] toggle', error);
    return null;
  }
}
