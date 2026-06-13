// src/app/streamers/page.tsx
import { getLiveStreamerIds, getMemberStreamers } from '@/lib/data-fetching';
import StreamerView from '@/components/streamer/StreamerView';
import { buildPageMetadata } from '@/lib/site';

export const metadata = buildPageMetadata({
  title: '지도동 멤버',
  description:
    '지도동 스트리머 멤버 프로필, 치지직·유튜브 채널, 라이브 상태와 방송 일정을 확인하세요.',
  path: '/streamers',
});

export default async function StreamersPage() {
  const [streamers, initialLiveIds] = await Promise.all([
    getMemberStreamers(),
    getLiveStreamerIds(),
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-50/50 p-2 transition-colors sm:p-4 md:p-6 dark:bg-slate-950">
      <header className="sr-only">
        <h1>지도동 멤버</h1>
        <p>지도동 스트리머 프로필, 라이브 상태, 방송 일정을 확인합니다.</p>
      </header>
      <StreamerView
        streamers={streamers}
        initialLiveIds={initialLiveIds}
      />
    </div>
  );
}
