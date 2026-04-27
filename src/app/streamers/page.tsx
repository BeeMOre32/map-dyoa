// src/app/streamers/page.tsx
import { getAllStreamers } from '@/lib/data-fetching';
import StreamerView from '@/components/streamer/StreamerView';

export default async function StreamersPage() {
  // 캐싱된 스트리머 데이터 사용
  const streamers = await getAllStreamers();

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950 transition-colors p-4 md:p-6">
      <StreamerView streamers={streamers} />
    </div>
  );
}
