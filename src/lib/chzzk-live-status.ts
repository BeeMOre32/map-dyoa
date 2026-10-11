import { unstable_cache } from 'next/cache';
import { extractChzzkChannelId } from '@/lib/chzzk';
import {
  fetchChzzkLiveStatus,
  isChzzkChannelLive,
  mapWithConcurrency,
  type ChzzkLiveStatusContent,
} from '@/lib/chzzk-api';
import { fetchWithBackoff } from '@/lib/map-dyoa-server-http-utils';
import { getPrismaForDomain } from '@/lib/prisma';
import { fetchAllStreamersFromServer } from '@/lib/map-dyoa-server-streamers';
import {
  getScheduleServerBaseUrl,
  isScheduleServerEnabled,
} from '@/lib/map-dyoa-server-schedules';

type GetLiveStreamerIdsOptions = {
  /** API·클라이언트 폴링 — 캐시 우회 */
  fresh?: boolean;
};

/** RSC 첫 paint용 — 클라이언트 폴링(45초)보다 짧게 */
export const LIVE_STATUS_CACHE_SECONDS = 30;

const CHZZK_POLL_CONCURRENCY = 6;

export type LiveChannel = {
  streamerId: string;
  channelId: string;
  status: ChzzkLiveStatusContent;
};

/** 멤버 채널을 polling으로 훑어 방송 중인 채널만 반환. 캐시 없음. */
export async function fetchLiveChannels(): Promise<LiveChannel[]> {
  const streamers = isScheduleServerEnabled()
    ? (await fetchAllStreamersFromServer(false))
        .filter((s) => s.chzzkUrl && !s.isGuest)
        .map((s) => ({ id: s.id, chzzkUrl: s.chzzkUrl! }))
    : await getPrismaForDomain().streamer.findMany({
        select: { id: true, chzzkUrl: true },
        where: { chzzkUrl: { not: null }, isGuest: false },
      });

  const results = await mapWithConcurrency(
    streamers,
    CHZZK_POLL_CONCURRENCY,
    async (s): Promise<LiveChannel | null> => {
      const channelId = extractChzzkChannelId(s.chzzkUrl!);
      if (!channelId) return null;

      const status = await fetchChzzkLiveStatus(channelId);
      if (!status || !isChzzkChannelLive(status)) return null;
      return { streamerId: s.id, channelId, status };
    },
  );

  return results.filter((c): c is LiveChannel => c !== null);
}

async function fetchLiveStreamerIdsLocal(): Promise<string[]> {
  return (await fetchLiveChannels()).map((c) => c.streamerId);
}

const getCachedLocalLiveStreamerIds = unstable_cache(
  fetchLiveStreamerIdsLocal,
  ['chzzk-live-status', process.env.MAP_DYOA_SERVER_URL ?? 'local-prisma'],
  { revalidate: LIVE_STATUS_CACHE_SECONDS },
);

async function fetchLiveStreamerIdsFromServer(fresh: boolean): Promise<string[]> {
  const base = getScheduleServerBaseUrl();
  if (!base) return [];

  const res = await fetchWithBackoff(`${base}/chzzk/live-status`, {
    cache: fresh ? 'no-store' : undefined,
    next: fresh ? undefined : { revalidate: LIVE_STATUS_CACHE_SECONDS },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { liveStreamerIds?: unknown[] };
  if (!Array.isArray(data.liveStreamerIds)) return [];
  return data.liveStreamerIds.map(String);
}

function mergeLiveIds(...lists: string[][]): string[] {
  return [...new Set(lists.flat())];
}

/** RSC·API 공통: 현재 라이브 중인 스트리머 id 목록 */
export async function getLiveStreamerIds(
  options?: GetLiveStreamerIdsOptions,
): Promise<string[]> {
  const fresh = options?.fresh ?? false;

  if (fresh) {
    // API·폴링 — 로컬 직접 조회만 (Fly 이중 폴링·누락 방지)
    return fetchLiveStreamerIdsLocal();
  }

  const [localIds, serverIds] = await Promise.all([
    getCachedLocalLiveStreamerIds(),
    fetchLiveStreamerIdsFromServer(false).catch(() => [] as string[]),
  ]);

  return mergeLiveIds(localIds, serverIds);
}
