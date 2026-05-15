import { unstable_cache } from 'next/cache';
import { fetchWithBackoff } from '@/lib/map-dyoa-server-http-utils';
import { getPrismaForDomain } from '@/lib/prisma';
import { fetchAllStreamersFromServer } from '@/lib/map-dyoa-server-streamers';
import {
  getScheduleServerBaseUrl,
  isScheduleServerEnabled,
} from '@/lib/map-dyoa-server-schedules';

function extractChannelId(url: string): string | null {
  try {
    const segments = new URL(url).pathname.split('/').filter(Boolean);
    return segments[segments.length - 1] ?? null;
  } catch {
    return null;
  }
}

async function fetchLiveStreamerIdsLocal(): Promise<string[]> {
  const streamers = isScheduleServerEnabled()
    ? (await fetchAllStreamersFromServer(false))
        .filter((s) => s.chzzkUrl && !s.isGuest)
        .map((s) => ({ id: s.id, chzzkUrl: s.chzzkUrl! }))
    : await getPrismaForDomain().streamer.findMany({
        select: { id: true, chzzkUrl: true },
        where: { chzzkUrl: { not: null }, isGuest: false },
      });

  const results = await Promise.all(
    streamers.map(async (s) => {
      const channelId = extractChannelId(s.chzzkUrl!);
      if (!channelId) return null;

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(
          `https://api.chzzk.naver.com/service/v2/channels/${channelId}/live-detail`,
          {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            cache: 'no-store',
            signal: controller.signal,
          },
        );
        clearTimeout(timer);
        if (!res.ok) return null;
        const json = await res.json();
        return json?.content?.status === 'OPEN' ? s.id : null;
      } catch {
        return null;
      }
    }),
  );

  return results.filter((id): id is string => id !== null);
}

const getCachedLocalLiveStreamerIds = unstable_cache(
  fetchLiveStreamerIdsLocal,
  ['chzzk-live-status', process.env.MAP_DYOA_SERVER_URL ?? 'local-prisma'],
  { revalidate: 60 },
);

/** RSC·API 공통: 현재 라이브 중인 스트리머 id 목록 */
export async function getLiveStreamerIds(): Promise<string[]> {
  const base = getScheduleServerBaseUrl();
  if (base) {
    try {
      const res = await fetchWithBackoff(`${base}/chzzk/live-status`, {
        next: { revalidate: 60 },
      });
      if (res.ok) {
        const data = (await res.json()) as { liveStreamerIds?: unknown[] };
        if (Array.isArray(data.liveStreamerIds)) {
          return data.liveStreamerIds.map(String);
        }
      }
    } catch {
      // Fly 실패 시 로컬 폴백
    }
  }

  return getCachedLocalLiveStreamerIds();
}
