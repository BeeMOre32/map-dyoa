'use client';

import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clapperboard, Plus, Construction, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import type { ClipWithParticipants } from '@/types/entities';
import type { Streamer } from '@prisma/client';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';
import ClipCard from './ClipCard';
import CreateClipModal from './CreateClipModal';

interface ClipViewProps {
  clips: ClipWithParticipants[];
  streamers: Streamer[];
  schedules: FlattenedSchedule[];
}

export default function ClipView({ clips, streamers, schedules }: ClipViewProps) {
  const { data: session } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [filterStreamerId, setFilterStreamerId] = useState('');
  const [showDevToast, setShowDevToast] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowDevToast(true), 400);
    const autoClose = setTimeout(() => setShowDevToast(false), 5000);
    return () => { clearTimeout(timer); clearTimeout(autoClose); };
  }, []);

  const filtered = filterStreamerId
    ? clips.filter((c) =>
        c.participants.some((p) => p.streamerId === filterStreamerId),
      )
    : clips;

  const handleOpen = useCallback(() => setShowModal(true), []);
  const handleClose = useCallback(() => setShowModal(false), []);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800 relative overflow-hidden">
      {/* 헤더 */}
      <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/20 shrink-0 gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Clapperboard className="w-5 h-5 text-indigo-500" />
            클립 모음
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            총 {filtered.length}개의 클립
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* 스트리머 필터 */}
          <select
            value={filterStreamerId}
            onChange={(e) => setFilterStreamerId(e.target.value)}
            className="px-3 py-2 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 transition-all"
          >
            <option value="">전체 스트리머</option>
            {streamers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* 클립 추가 버튼 (로그인 시만) */}
          {session && (
            <button
              onClick={handleOpen}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">클립 추가</span>
            </button>
          )}
        </div>
      </div>

      {/* 클립 그리드 */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-3xl">
            <Clapperboard className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 dark:text-slate-500 font-bold">
              {filterStreamerId
                ? '해당 스트리머의 클립이 없습니다.'
                : '아직 등록된 클립이 없습니다.'}
            </p>
            {session && !filterStreamerId && (
              <button
                onClick={handleOpen}
                className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-2xl transition-all"
              >
                첫 클립 추가하기
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((clip) => (
              <ClipCard key={clip.id} clip={clip} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <CreateClipModal
            streamers={streamers}
            schedules={schedules}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>

      {/* 개발중 토스트 */}
      <AnimatePresence>
        {showDevToast && (
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="fixed bottom-6 right-4 sm:right-6 z-200 w-[calc(100vw-2rem)] max-w-xs sm:w-72"
          >
            <div className="bg-white dark:bg-slate-800 rounded-[1.75rem] shadow-2xl shadow-slate-300/40 dark:shadow-black/50 border border-slate-100 dark:border-slate-700 p-4 flex items-center gap-3">
              <div className="shrink-0 p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400 rounded-2xl">
                <Construction className="w-5 h-5" />
              </div>
              <p className="flex-1 text-sm font-black text-slate-700 dark:text-slate-200">
                아직 열심히 개발중입니다. 🚧
              </p>
              <button
                onClick={() => setShowDevToast(false)}
                className="shrink-0 p-1.5 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
