// src/components/streamer/StreamerView.tsx
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Streamer } from '@prisma/client';
import RequestEditModal from '../Form/RequestEdit';
import StreamerCard from './StreamerCard';
import { matchesChosung } from '@/lib/chosung';

export default function StreamerView({ streamers }: { streamers: Streamer[] }) {
  const [requestTarget, setRequestTarget] = useState<Streamer | null>(null);
  const [search, setSearch] = useState('');
  const [activeGen, setActiveGen] = useState<number | null>(null);

  const generations = useMemo(
    () => [...new Set(streamers.map((s) => s.generation))].sort((a, b) => a - b),
    [streamers],
  );

  const filtered = useMemo(
    () =>
      streamers.filter((s) => {
        const matchSearch = !search || matchesChosung(s.name, search);
        const matchGen = activeGen === null || s.generation === activeGen;
        return matchSearch && matchGen;
      }),
    [streamers, search, activeGen],
  );

  const handleRequestEdit = useCallback((streamer: Streamer) => {
    setRequestTarget(streamer);
  }, []);

  const handleClose = useCallback(() => {
    setRequestTarget(null);
  }, []);

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800 relative">

      {/* 헤더 — 페이지 스크롤 시 상단 고정 */}
      <div className="sticky top-0 z-10 p-6 pb-4 border-b border-slate-50 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-t-3xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white">
              참여 방송인 목록
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              {search || activeGen !== null
                ? `${filtered.length}명 검색됨`
                : `총 ${streamers.length}명의 방송인이 지도동과 함께합니다.`}
            </p>
          </div>
        </div>

        {/* 필터 + 검색 */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 기수 필터 */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
            {[null, ...generations].map((gen) => {
              const isActive = activeGen === gen;
              return (
                <button
                  key={gen ?? 'all'}
                  onClick={() => setActiveGen(gen)}
                  className={`relative px-3 py-1.5 text-xs font-black rounded-lg transition-colors z-10 ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="streamer-gen-active"
                      className="absolute inset-0 bg-indigo-600 rounded-lg"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10">
                    {gen === null ? '전체' : `${gen}기`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 검색창 */}
          <div className="flex-1 min-w-36 flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-3 py-2 shadow-sm">
            <Search className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름 또는 초성 검색..."
              className="flex-1 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none"
            />
            <AnimatePresence>
              {search && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  onClick={() => setSearch('')}
                  className="text-slate-300 dark:text-slate-600 hover:text-slate-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 카드 그리드 */}
      <div className="p-6">
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-3xl"
          >
            <p className="text-slate-400 dark:text-slate-500 font-bold">검색 결과가 없어요</p>
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((streamer, i) => (
                <motion.div
                  key={streamer.id}
                  layout
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    transition: { delay: i * 0.04, duration: 0.2, ease: 'easeOut' },
                  }}
                  exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.15 } }}
                >
                  <StreamerCard
                    streamer={streamer}
                    onRequestEdit={handleRequestEdit}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {requestTarget && (
          <RequestEditModal streamer={requestTarget} onClose={handleClose} />
        )}
      </AnimatePresence>
    </div>
  );
}
