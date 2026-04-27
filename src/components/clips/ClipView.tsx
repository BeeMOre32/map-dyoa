'use client';

import { useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clapperboard, Plus } from 'lucide-react';
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
  const [editingClip, setEditingClip] = useState<ClipWithParticipants | null>(null);
  const [filterStreamerId, setFilterStreamerId] = useState('');

  const filtered = useMemo(
    () =>
      filterStreamerId
        ? clips.filter((c) =>
            c.participants.some((p) => p.streamerId === filterStreamerId),
          )
        : clips,
    [clips, filterStreamerId],
  );

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
            <motion.button
              onClick={handleOpen}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="relative flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-2xl shadow-lg shadow-indigo-300/50 dark:shadow-indigo-900/40 transition-colors overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-white/10"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
              />
              <Plus className="w-4 h-4 relative z-10" />
              <span className="relative z-10">클립 추가</span>
            </motion.button>
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
              <ClipCard key={clip.id} clip={clip} onEdit={setEditingClip} />
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

      <AnimatePresence>
        {editingClip && (
          <CreateClipModal
            streamers={streamers}
            schedules={schedules}
            initialData={editingClip}
            onClose={() => setEditingClip(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
