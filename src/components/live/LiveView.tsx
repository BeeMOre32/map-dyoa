'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, LayoutGrid, Wifi, WifiOff, Puzzle, ExternalLink } from 'lucide-react';
import { track } from '@vercel/analytics';
import type { Streamer } from '@prisma/client';
import { MAX_STREAMS } from '@/components/multiview/utils';
import { useLiveStatus } from '@/hooks/useLiveStatus';
import StreamerAvatar from '@/components/streamer/StreamerAvatar';
import { getStreamerImagePath } from '@/lib/utils';

const EXTENSION_URL = 'https://chromewebstore.google.com/detail/jmehpmfkiciefbgoebiljadeamohkgfb';

function StreamerCard({
  streamer,
  isLive,
  selected,
  onToggle,
}: {
  streamer: Streamer;
  isLive: boolean;
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  const isSelected = selected.has(streamer.id);
  const isDisabled = !isSelected && selected.size >= MAX_STREAMS;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      onClick={() => onToggle(streamer.id)}
      disabled={isDisabled}
      className={`group relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all text-left ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
          : isDisabled
            ? 'border-transparent opacity-40 cursor-not-allowed'
            : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
      }`}
    >
      <div className="relative">
        <div className="relative w-14 h-14 rounded-2xl overflow-hidden">
          <StreamerAvatar
            name={streamer.name}
            imgSrc={getStreamerImagePath(streamer.name)}
            colorCode={streamer.colorCode}
            streamerId={streamer.id}
            size="medium"
          />
          {isSelected && (
            <div className="absolute inset-0 border-2 border-indigo-500 flex items-center justify-center bg-indigo-500/20">
              <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}
        </div>
        {isLive && (
          <span className="absolute -bottom-1 -right-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black leading-none shadow-sm">
            <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
        )}
      </div>
      <span className={`text-xs font-bold text-center leading-tight line-clamp-1 w-full ${
        isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'
      }`}>
        {streamer.name}
      </span>
    </motion.button>
  );
}

export default function LiveView({ streamers }: { streamers: Streamer[] }) {
  const router = useRouter();

  const { liveIds, isLoading: loading } = useLiveStatus();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_STREAMS) {
        next.add(id);
      }
      return next;
    });
  };

  const startMultiview = () => {
    if (selected.size === 0) return;
    const ids = [...selected].join(',');
    router.push(`/live/multiview?ids=${ids}`);
  };

  const liveStreamers = streamers.filter((s) => liveIds.has(s.id));
  const offlineStreamers = streamers.filter((s) => !liveIds.has(s.id));

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">

          {/* 확장 프로그램 배너 */}
          <a
            href={EXTENSION_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('extension_banner_clicked')}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors group"
          >
            <Puzzle className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-amber-700 dark:text-amber-400 leading-none mb-0.5">채팅 확장 프로그램 설치</p>
              <p className="text-[10px] text-amber-500/70 dark:text-amber-500/60 font-medium">멀티뷰 채팅 기능을 사용하려면 Chrome 확장 프로그램이 필요합니다</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-amber-400 shrink-0 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors" />
          </a>

          {/* 라이브 중 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-black text-slate-800 dark:text-white">
                라이브 중
              </h2>
              {!loading && (
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                  {liveStreamers.length}명
                </span>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 p-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    <div className="w-12 h-3 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : liveStreamers.length === 0 ? (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500">
                <Radio className="w-4 h-4 shrink-0" />
                <p className="text-sm font-medium">현재 라이브 중인 멤버가 없습니다</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                <AnimatePresence>
                  {liveStreamers.map((s) => (
                    <StreamerCard key={s.id} streamer={s} isLive selected={selected} onToggle={toggle} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>

          {/* 오프라인 */}
          {!loading && offlineStreamers.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-black text-slate-500 dark:text-slate-400">오프라인</h2>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 opacity-60">
                {offlineStreamers.map((s) => (
                  <StreamerCard key={s.id} streamer={s} isLive={false} selected={selected} onToggle={toggle} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* 멀티뷰 시작 플로팅 버튼 */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="shrink-0 p-4 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
          >
            <div className="max-w-2xl mx-auto flex items-center gap-3">
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 flex-1">
                <span className="font-black text-slate-800 dark:text-white">{selected.size}명</span> 선택됨
                {selected.size >= MAX_STREAMS && (
                  <span className="ml-2 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">최대</span>
                )}
              </p>
              <button
                onClick={startMultiview}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black transition-colors shadow-lg shadow-indigo-900/20"
              >
                <LayoutGrid className="w-4 h-4" />
                멀티뷰 시작
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
