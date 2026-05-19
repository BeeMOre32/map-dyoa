'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  clipEmptyStateVariants,
  clipGridPresenceVariants,
} from '@/lib/clipMotion';
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

  const gridFilterKey = useMemo(
    () =>
      `${currentFilters.streamerId}-${currentFilters.month}-${currentFilters.q}-${currentFilters.sort}-${currentFilters.favoritesOnly}-${currentPage}`,
    [currentFilters, currentPage],
  );

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
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-900/50 sm:rounded-3xl sm:shadow-xl sm:shadow-slate-200/50">
      <FavoritesClipFilter favoritesParam={!!currentFilters.favoritesOnly} />
      {/* 헤더 */}
      <motion.div
        layout
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`flex shrink-0 flex-col space-y-2 border-b border-slate-50 bg-slate-50/80 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/40 sm:space-y-3 ${
          isHeaderCondensed ? 'p-2.5' : 'p-3 sm:p-4'
        }`}
      >
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h2
              className={`flex items-center gap-1.5 whitespace-nowrap font-black text-slate-800 transition-all dark:text-white sm:gap-2 ${
                isHeaderCondensed ? 'text-sm' : 'text-base sm:text-lg'
              }`}
            >
              <Clapperboard className="h-4 w-4 shrink-0 text-indigo-500 sm:h-[18px] sm:w-[18px]" />
              클립 모음
            </h2>
            {!isHeaderCondensed && (
              <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                총 {total}개의 클립
              </p>
            )}
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:shrink-0 sm:justify-end sm:gap-2">
            <FavoritesOnlyToggle className="!px-2 !py-1 text-[11px] sm:!px-3 sm:!py-1.5 sm:text-sm" />
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-500 transition-colors hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-slate-100 sm:gap-1.5 sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              필터
              {shouldShowAdvancedFilters ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
            {session && (
              <motion.button
                onClick={handleOpen}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="relative ml-auto inline-flex items-center gap-1 overflow-hidden rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-black text-white shadow-lg shadow-indigo-300/40 transition-colors hover:bg-indigo-700 dark:shadow-indigo-900/30 sm:ml-0 sm:gap-1.5 sm:rounded-xl sm:px-3.5 sm:py-2 sm:text-xs"
              >
                <motion.div
                  className="absolute inset-0 bg-white/10"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
                />
                <Plus className="relative z-10 h-3.5 w-3.5" />
                <span className="relative z-10">추가</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* 검색 */}
        <div className="relative w-full min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="제목 · 스트리머 검색"
            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-2.5 text-xs font-medium text-slate-700 transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:placeholder:text-slate-500 dark:focus:ring-indigo-700 sm:rounded-xl sm:pl-9 sm:pr-3 sm:text-sm"
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
      <motion.div className="flex-1 overflow-y-auto p-3 sm:p-4" onScroll={handleGridScroll}>
        <AnimatePresence mode="wait">
        {isPending ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
          >
            {Array.from({ length: clips.length || 8 }).map((_, i) => (
              <ClipSkeletonCard key={i} index={i} />
            ))}
          </motion.div>
        ) : clips.length === 0 ? (
          <motion.div
            key="empty"
            variants={clipEmptyStateVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="rounded-3xl border-2 border-dashed border-slate-100 py-20 text-center dark:border-slate-700"
          >
            <Clapperboard className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
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
          </motion.div>
        ) : (
          <motion.div
            key={gridFilterKey}
            variants={clipGridPresenceVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
          >
            {clips.map((clip, i) => (
              <ClipCard key={clip.id} clip={clip} index={i} onEdit={setEditingClip} />
            ))}
          </motion.div>
        )}
        </AnimatePresence>
      </motion.div>

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
