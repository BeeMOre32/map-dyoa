// src/app/streamers/page.tsx
import { getAllStreamers } from '@/lib/data-fetching';
import StreamerViewClient from '@/components/streamer/StreamerViewClient';

export default async function StreamersPage() {
  const streamers = await getAllStreamers();

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-50/50 p-4 transition-colors md:p-6 dark:bg-slate-950">
      <StreamerViewClient streamers={streamers} />
    </div>
  );
}
