'use client';

import dynamic from 'next/dynamic';
import type { Streamer } from '@prisma/client';

function StreamerViewPlaceholder() {
  return (
    <div
      className="flex min-h-[55vh] flex-col rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-900/50"
      aria-busy="true"
      aria-label="멤버 목록을 불러오는 중"
    />
  );
}

const StreamerPanel = dynamic(() => import('./StreamerView'), {
  ssr: false,
  loading: StreamerViewPlaceholder,
});

export default function StreamerViewClient({ streamers }: { streamers: Streamer[] }) {
  return <StreamerPanel streamers={streamers} />;
}
