// src/app/streamers/page.tsx
import { getLiveStreamerIds, getMemberStreamers } from '@/lib/data-fetching';
import StreamerView from '@/components/streamer/StreamerView';
import { buildPageMetadata } from '@/lib/site';

export const metadata = buildPageMetadata({
  title: '멤버',
  description: '지도동 멤버 프로필, 방송 채널, 라이브 상태를 확인하세요.',
  path: '/streamers',
});

export default async function StreamersPage() {
  const [streamers, initialLiveIds] = await Promise.all([
    getMemberStreamers(),
    getLiveStreamerIds(),
  ]);
  const initialLiveFetchedAt = Date.now();

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-50/50 p-4 transition-colors md:p-6 dark:bg-slate-950">
      <StreamerView
        streamers={streamers}
        initialLiveIds={initialLiveIds}
        initialLiveFetchedAt={initialLiveFetchedAt}
      />
    </div>
  );
}
