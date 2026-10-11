import { unstable_cache } from 'next/cache';
import { extractChzzkChannelId } from '@/lib/chzzk';
import {
  fetchChzzkLiveStatus,
  isChzzkChannelLive,
  mapWithConcurrency,
  type ChzzkLiveStatusContent,
} from '@/lib/chzzk-api';
import { getPrismaForDomain } from '@/lib/prisma';
import { fetchAllStreamersFromServer } from '@/lib/map-dyoa-server-streamers';
import { isScheduleServerEnabled } from '@/lib/map-dyoa-server-schedules';

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

/**
 * 현재 라이브 중인 스트리머 id.
 * 치지직 조회는 Next polling만 쓴다. Fly `/chzzk/live-status`와 합치면
 * 오래된 캐시가 끝난 방송을 첫 화면에 LIVE로 남긴다.
 */
export async function getLiveStreamerIds(
  options?: GetLiveStreamerIdsOptions,
): Promise<string[]> {
  if (options?.fresh) return fetchLiveStreamerIdsLocal();
  return getCachedLocalLiveStreamerIds();
}
