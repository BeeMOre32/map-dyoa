'use client';

import { useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clapperboard, Plus, Search, X, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { format, isValid, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { ClipWithParticipants } from '@/types/entities';
import type { Streamer } from '@prisma/client';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';
import { useClipNavigation, type ClipSortOption } from '@/hooks/useClipNavigation';
import ClipCard from './ClipCard';
import CreateClipModal from './CreateClipModal';
import { ClipSkeletonCard } from './ClipSkeleton';
import { ClipPagination } from './ClipPagination';
import FavoritesOnlyToggle from '@/components/Common/FavoritesOnlyToggle';
import FavoritesClipFilter from './FavoritesClipFilter';

interface ClipViewProps {
  clips: ClipWithParticipants[];
  streamers: Streamer[];
  schedules: FlattenedSchedule[];
  monthOptions: string[];
  total: number;
  totalPages: number;
  currentPage: number;
  currentFilters: {
    streamerId: string;
    month: string;
    q: string;
    sort: ClipSortOption;
    favoritesOnly?: boolean;
  };
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
  const [showFilters, setShowFilters] = useState(false);
  const [isHeaderCondensed, setIsHeaderCondensed] = useState(false);
  const lastScrollTopRef = useRef(0);

  const { isPending, searchValue, setSearchValue, buildUrl, navigate, clearFilters, hasFilter } =
    useClipNavigation(currentFilters, currentPage);

  const handleOpen = useCallback(() => setShowModal(true), []);
  const handleClose = useCallback(() => setShowModal(false), []);
  const shouldShowAdvancedFilters = (showFilters && !isHeaderCondensed) || hasFilter;

  const handleGridScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const nextTop = e.currentTarget.scrollTop;
    const delta = nextTop - lastScrollTopRef.current;

    if (nextTop <= 16) {
      setIsHeaderCondensed(false);
    } else if (delta > 8) {
      setIsHeaderCondensed(true);
    } else if (delta < -8) {
      setIsHeaderCondensed(false);
    }

    lastScrollTopRef.current = nextTop;
  }, []);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800 relative overflow-hidden">
      <FavoritesClipFilter favoritesParam={!!currentFilters.favoritesOnly} />
      {/* 헤더 */}
      <motion.div
        layout
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`border-b border-slate-50 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40 backdrop-blur-sm shrink-0 space-y-3 ${
          isHeaderCondensed ? 'p-3' : 'p-4'
        }`}
      >
        <div className="flex justify-between items-center gap-4">
          <div>
            <h2
              className={`font-black text-slate-800 dark:text-white flex items-center gap-2 transition-all ${
                isHeaderCondensed ? 'text-base' : 'text-lg'
              }`}
            >
              <Clapperboard className="w-4.5 h-4.5 text-indigo-500" />
              클립 모음
            </h2>
            <p
              className={`text-slate-500 dark:text-slate-400 font-medium transition-all ${
                isHeaderCondensed ? 'text-[11px] mt-0' : 'text-xs mt-0.5'
              }`}
            >
              총 {total}개의 클립
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <FavoritesOnlyToggle />
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              필터
              {shouldShowAdvancedFilters ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
            {session && (
              <motion.button
                onClick={handleOpen}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="relative flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-300/40 dark:shadow-indigo-900/30 transition-colors overflow-hidden shrink-0"
              >
                <motion.div
                  className="absolute inset-0 bg-white/10"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
                />
                <Plus className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">클립 추가</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* 필터 행 */}
        <div className="relative flex-1 min-w-36">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="제목 · 스트리머 검색"
            className="w-full pl-9 pr-3 py-1.5 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 transition-all"
          />
        </div>

        <AnimatePresence initial={false}>
          {shouldShowAdvancedFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -6 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                <select
                  value={currentFilters.month}
                  onChange={(e) =>
                    navigate(buildUrl({ month: e.target.value, page: 1 }))
                  }
                  className="px-3 py-1.5 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 transition-all"
                >
                  <option value="">전체 기간</option>
                  {monthOptions.map((m) => {
                    const d = parseISO(`${m}-01`);
                    const label = isValid(d) ? format(d, 'yyyy년 M월', { locale: ko }) : m;
                    return (
                      <option key={m} value={m}>
                        {label}
                      </option>
                    );
                  })}
                </select>

                <select
                  value={currentFilters.streamerId}
                  onChange={(e) =>
                    navigate(buildUrl({ streamer: e.target.value, page: 1 }))
                  }
                  className="px-3 py-1.5 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 transition-all"
                >
                  <option value="">전체 스트리머</option>
                  {streamers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <select
                  value={currentFilters.sort}
                  onChange={(e) =>
                    navigate(
                      buildUrl({ sort: e.target.value as ClipSortOption, page: 1 }),
                    )
                  }
                  className="px-3 py-1.5 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 transition-all"
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
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    초기화
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 클립 그리드 */}
      <div className="flex-1 overflow-y-auto p-4" onScroll={handleGridScroll}>
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
        isPending={isPending}
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
