import { Radio } from 'lucide-react';
import { getAllStreamers } from '@/lib/data-fetching';
import LiveView from '@/components/live/LiveView';

export default async function LivePage() {
  const streamers = await getAllStreamers();

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-2xl mx-auto flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-red-100 dark:bg-red-900/30">
            <Radio className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 dark:text-white leading-tight">라이브</h1>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">지금 방송 중인 멤버 · 멀티뷰로 함께 시청하세요</p>
          </div>
        </div>
      </div>
      <LiveView streamers={streamers} />
    </div>
  );
}
