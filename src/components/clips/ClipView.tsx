'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  clipEmptyStateVariants,
  clipGridPresenceVariants,
} from '@/lib/clipMotion';
import { Button, ListBox, SearchField, Select } from '@heroui/react';
import { Clapperboard, Plus, SlidersHorizontal, X } from 'lucide-react';
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

function ClipFilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <Select
      aria-label={label}
      className="w-fit max-w-full"
      selectedKey={value}
      onSelectionChange={(key) => {
        if (key == null) return;
        onChange(String(key));
      }}
    >
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover className="max-h-72 overflow-auto">
        <ListBox>
          {options.map((option) => (
            <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
              {option.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

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
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <FavoritesClipFilter favoritesParam={!!currentFilters.favoritesOnly} />
      {/* 헤더 */}
      <motion.div
        layout
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`flex shrink-0 flex-col space-y-2 border-b border-slate-50 bg-slate-50/80 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/40 sm:space-y-3 ${
          isHeaderCondensed ? 'p-2.5' : 'p-3 sm:p-4'
        }`}
      >
        <div className="flex items-center justify-between gap-2 sm:gap-4">
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
            <FavoritesOnlyToggle appearance="hero" />
            <Button
              size="sm"
              variant={shouldShowAdvancedFilters ? 'secondary' : 'outline'}
              onPress={() => {
                setIsHeaderCondensed(false);
                setShowFilters((prev) => !prev);
              }}
            >
              <SlidersHorizontal className="size-3.5" />
              필터
            </Button>
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
        <SearchField
          aria-label="클립 검색"
          className="w-full"
          value={searchValue}
          onChange={setSearchValue}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input className="text-sm" placeholder="제목 · 스트리머 검색" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        {shouldShowAdvancedFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                <ClipFilterSelect
                  label="기간"
                  value={currentFilters.month || 'all'}
                  onChange={(month) =>
                    navigate(buildUrl({ month: month === 'all' ? '' : month, page: 1 }))
                  }
                  options={[
                    { id: 'all', label: '전체 기간' },
                    ...monthOptions.map((month) => {
                      const date = parseISO(`${month}-01`);
                      return {
                        id: month,
                        label: isValid(date) ? format(date, 'yyyy년 M월', { locale: ko }) : month,
                      };
                    }),
                  ]}
                />
                <ClipFilterSelect
                  label="스트리머"
                  value={currentFilters.streamerId || 'all'}
                  onChange={(streamer) =>
                    navigate(buildUrl({ streamer: streamer === 'all' ? '' : streamer, page: 1 }))
                  }
                  options={[
                    { id: 'all', label: '전체 스트리머' },
                    ...streamers.map((streamer) => ({ id: streamer.id, label: streamer.name })),
                  ]}
                />
                <ClipFilterSelect
                  label="정렬"
                  value={currentFilters.sort}
                  onChange={(sort) =>
                    navigate(buildUrl({ sort: sort as ClipSortOption, page: 1 }))
                  }
                  options={[
                    { id: 'newest', label: '최신 등록순' },
                    { id: 'oldest', label: '오래된 순' },
                    { id: 'date_desc', label: '클립 날짜 최신순' },
                    { id: 'date_asc', label: '클립 날짜 오래된순' },
                    { id: 'title', label: '제목순' },
                  ]}
                />
                {hasFilter && (
                  <Button size="sm" variant="ghost" onPress={clearFilters}>
                    <X className="size-3.5" />
                    초기화
                  </Button>
                )}
              </div>
        )}
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
            className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
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
            className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
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
          <CreateClipModal
            streamers={streamers}
            schedules={schedules}
            onClose={handleClose}
            bongnudoPreset={currentFilters.q.includes('봉누도')}
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
