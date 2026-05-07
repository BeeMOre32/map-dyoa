'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clapperboard, Plus, Search, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { ClipWithParticipants } from '@/types/entities';
import type { Streamer } from '@prisma/client';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';
import { useClipNavigation, type ClipSortOption } from '@/hooks/useClipNavigation';
import ClipCard from './ClipCard';
import CreateClipModal from './CreateClipModal';
import { ClipSkeletonCard } from './ClipSkeleton';
import { ClipPagination } from './ClipPagination';

interface ClipViewProps {
  clips: ClipWithParticipants[];
  streamers: Streamer[];
  schedules: FlattenedSchedule[];
  monthOptions: string[];
  total: number;
  totalPages: number;
  currentPage: number;
  currentFilters: { streamerId: string; month: string; q: string; sort: ClipSortOption };
}

export default function ClipView({
  clips,
  streamers,
  schedules,
  monthOptions,
  total,
  totalPages,
  currentPage,
  currentFilters,
}: ClipViewProps) {
  const { data: session } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [editingClip, setEditingClip] = useState<ClipWithParticipants | null>(null);

  const { isPending, searchValue, setSearchValue, buildUrl, navigate, clearFilters, hasFilter } =
    useClipNavigation(currentFilters, currentPage);

  const handleOpen = useCallback(() => setShowModal(true), []);
  const handleClose = useCallback(() => setShowModal(false), []);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800 relative overflow-hidden">
      {/* 헤더 */}
      <div className="p-6 border-b border-slate-50 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20 shrink-0 space-y-4">
        <div className="flex justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Clapperboard className="w-5 h-5 text-indigo-500" />
              클립 모음
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">총 {total}개의 클립</p>
          </div>

          {session && (
            <motion.button
              onClick={handleOpen}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="relative flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-2xl shadow-lg shadow-indigo-300/50 dark:shadow-indigo-900/40 transition-colors overflow-hidden shrink-0"
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

        {/* 필터 행 */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-36">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="제목 · 스트리머 검색"
              className="w-full pl-9 pr-3 py-2 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 transition-all"
            />
          </div>

          <select
            value={currentFilters.month}
            onChange={(e) => navigate(buildUrl({ month: e.target.value, page: 1 }))}
            className="px-3 py-2 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 transition-all"
          >
            <option value="">전체 기간</option>
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {format(new Date(`${m}-01`), 'yyyy년 M월', { locale: ko })}
              </option>
            ))}
          </select>

          <select
            value={currentFilters.streamerId}
            onChange={(e) => navigate(buildUrl({ streamer: e.target.value, page: 1 }))}
            className="px-3 py-2 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 transition-all"
          >
            <option value="">전체 스트리머</option>
            {streamers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            value={currentFilters.sort}
            onChange={(e) => navigate(buildUrl({ sort: e.target.value as ClipSortOption, page: 1 }))}
            className="px-3 py-2 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 transition-all"
          >
            <option value="newest">최신 등록순</option>
            <option value="oldest">오래된 순</option>
            <option value="date_desc">클립 날짜 최신순</option>
            <option value="date_asc">클립 날짜 오래된순</option>
            <option value="title">제목순</option>
          </select>

          {hasFilter && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 클립 그리드 */}
      <div className="flex-1 overflow-y-auto p-6">
        {isPending ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: clips.length || 8 }).map((_, i) => (
              <ClipSkeletonCard key={i} />
            ))}
          </div>
        ) : clips.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-3xl">
            <Clapperboard className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 dark:text-slate-500 font-bold">
              {hasFilter ? '검색 결과가 없습니다.' : '아직 등록된 클립이 없습니다.'}
            </p>
            {session && !hasFilter && (
              <button
                onClick={handleOpen}
                className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-2xl transition-all"
              >
                첫 클립 추가하기
              </button>
            )}
            {hasFilter && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm font-bold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                필터 초기화
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {clips.map((clip) => (
              <ClipCard key={clip.id} clip={clip} onEdit={setEditingClip} />
            ))}
          </div>
        )}
      </div>

      <ClipPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onNavigate={(page) => navigate(buildUrl({ page }))}
      />

      <AnimatePresence>
        {showModal && (
          <CreateClipModal streamers={streamers} schedules={schedules} onClose={handleClose} />
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
