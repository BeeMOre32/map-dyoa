'use client';

import { AnimatePresence, motion } from 'motion/react';
import {
  streamerListPresenceVariants,
  streamerMultiviewBarVariants,
} from '@/lib/streamerMotion';
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, LayoutGrid, RefreshCw } from 'lucide-react';
import { Button, Card, Chip, Input, TextField } from '@heroui/react';
import { Streamer } from '@prisma/client';
import { useIsDarkAfterMount } from '@/hooks/useIsDarkAfterMount';
import dynamic from 'next/dynamic';

const RequestEditModal = dynamic(() => import('../Form/RequestEdit'), {
  ssr: false,
});
import StreamerCard from './StreamerCard';
import StreamerAvatar from './StreamerAvatar';
import { useChosungSearch } from '@/hooks/useChosungSearch';
import { useLiveStatus } from '@/hooks/useLiveStatus';
import { MAX_STREAMS } from '@/components/multiview/utils';
import { getStreamerColor } from '@/constants/streamercolor';
import { getStreamerImagePath } from '@/lib/utils';
import { format } from 'date-fns';
import { track } from '@vercel/analytics';
import { useFavoriteStreamers } from '@/hooks/useFavoriteStreamers';
import FavoritesOnlyToggle from '@/components/Common/FavoritesOnlyToggle';
import BongnudoPromoBanner from '@/components/bongnudo/BongnudoPromoBanner';

export default function StreamerView({
  streamers,
  initialLiveIds,
}: {
  streamers: Streamer[];
  initialLiveIds?: string[];
}) {
  const router = useRouter();
  const isDark = useIsDarkAfterMount();
  const { favorites, favoriteIds, favoritesOnly, setFavoritesOnly } =
    useFavoriteStreamers();

  const [requestTarget, setRequestTarget] = useState<Streamer | null>(null);
  const [activeGen, setActiveGen] = useState<number | null>(null);
  // 선택 순서를 유지하는 배열 (Set 대신 Array)
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const { liveIds, viewerCounts, isRefreshing, lastUpdatedAt, isStale, refresh } = useLiveStatus(
    initialLiveIds,
  );

  const generations = useMemo(
    () => [...new Set(streamers.map((s) => s.generation))].sort((a, b) => a - b),
    [streamers],
  );

  const genFilter = useCallback(
    (s: Streamer) => {
      if (favoritesOnly && !favoriteIds.has(s.id)) return false;
      return activeGen === null || s.generation === activeGen;
    },
    [activeGen, favoritesOnly, favoriteIds],
  );

  const { search, setSearch, filtered } = useChosungSearch(streamers, genFilter);

  const liveFiltered = useMemo(() => filtered.filter((s) => liveIds.has(s.id)), [filtered, liveIds]);
  const offlineFiltered = useMemo(() => filtered.filter((s) => !liveIds.has(s.id)), [filtered, liveIds]);
  const streamerMap = useMemo(() => new Map(streamers.map((s) => [s.id, s])), [streamers]);

  const handleRequestEdit = useCallback((streamer: Streamer) => setRequestTarget(streamer), []);
  const handleClose = useCallback(() => setRequestTarget(null), []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedOrder((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length < MAX_STREAMS) return [...prev, id];
      return prev;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedOrder([]), []);

  const startMultiview = useCallback(() => {
    if (selectedOrder.length === 0) return;
    track('multiview_started', {
      streamer_count: selectedOrder.length,
      live_count: selectedOrder.filter((id) => liveIds.has(id)).length,
    });
    router.push(`/live/multiview?ids=${selectedOrder.join(',')}`);
  }, [selectedOrder, liveIds, router]);

  const isMaxReached = selectedOrder.length >= MAX_STREAMS;

  // 드래그&드롭으로 선택 순서 변경
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId((prev) => (prev === id ? prev : id));
  };
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId === targetId) { setDragOverId(null); return; }
    setSelectedOrder((prev) => {
      const arr = [...prev];
      const from = arr.indexOf(draggedId);
      const to = arr.indexOf(targetId);
      if (from < 0 || to < 0) return prev;
      arr.splice(from, 1);
      arr.splice(to, 0, draggedId);
      return arr;
    });
    setDragOverId(null);
  };

  const subtitle = useMemo(() => {
    if (search.trim() || activeGen !== null) {
      return { kind: 'filter' as const, text: `조건에 맞는 멤버 ${filtered.length}명` };
    }
    if (liveFiltered.length > 0) {
      return {
        kind: 'live' as const,
        live: liveFiltered.length,
        total: streamers.length,
      };
    }
    return { kind: 'default' as const, total: streamers.length };
  }, [search, activeGen, filtered.length, liveFiltered.length, streamers.length]);

  const refreshStatus = useMemo(() => {
    if (isRefreshing) return { kind: 'loading' as const, text: '갱신 중' };
    if (!lastUpdatedAt) return { kind: 'loading' as const, text: '확인 중' };
    if (isStale) {
      return {
        kind: 'stale' as const,
        text: `${format(new Date(lastUpdatedAt), 'HH:mm')} · 오래됨`,
      };
    }

    return {
      kind: 'done' as const,
      text: `${format(new Date(lastUpdatedAt), 'HH:mm')} 갱신`,
    };
  }, [isRefreshing, lastUpdatedAt, isStale]);

  const listFilterKey = `${activeGen ?? 'all'}-${search.trim()}-${favoritesOnly}`;

  const cardGrid = (list: Streamer[], startIndex = 0) => (
    <div className="relative z-0 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {list.map((streamer, i) => {
        const idx = selectedOrder.indexOf(streamer.id);
        return (
          <StreamerCard
            key={streamer.id}
            streamer={streamer}
            onRequestEdit={handleRequestEdit}
            isLive={liveIds.has(streamer.id)}
            viewerCount={viewerCounts.get(streamer.id)}
            isSelected={idx >= 0}
            isMaxReached={isMaxReached}
            onToggleMultiview={() => toggleSelect(streamer.id)}
            selectionIndex={idx >= 0 ? idx + 1 : undefined}
            index={startIndex + i}
          />
        );
      })}
    </div>
  );

  return (
    <>
      <BongnudoPromoBanner />
      {/* sticky는 근처 스크롤 조상(layout overflow-y-auto) 안에서 동작하도록 카드에는 overflow:hidden 미사용 */}
      <div className="flex flex-col rounded-2xl border border-slate-100 bg-white shadow-lg shadow-slate-200/40 sm:rounded-3xl sm:shadow-xl sm:shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-900/50">
        <header className="sticky top-0 z-30 shrink-0 border-b border-slate-100 bg-white/95 px-3 py-2.5 backdrop-blur-sm shadow-[0_4px_12px_-8px_rgba(15,23,42,0.15)] dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-[0_6px_16px_-10px_rgba(0,0,0,0.4)] sm:px-5 sm:py-4">
          <div className="mb-2 flex items-start justify-between gap-2 sm:mb-3 sm:items-end">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold tracking-tight sm:text-xl">
                멤버
              </h2>
              <p className="mt-0.5 text-[10px] font-bold leading-snug text-slate-500 dark:text-slate-400 sm:mt-1 sm:text-xs">
                {subtitle.kind === 'filter' && subtitle.text}
                {subtitle.kind === 'default' && <>등록된 멤버 {subtitle.total}명</>}
                {subtitle.kind === 'live' && (
                  <>
                    지금 방송 중{' '}
                    <span className="tabular-nums text-red-500 dark:text-red-400">{subtitle.live}명</span>
                    <span className="mx-1 font-medium text-slate-400 dark:text-slate-500">·</span>
                    전체 <span className="tabular-nums text-slate-600 dark:text-slate-300">{subtitle.total}명</span>
                  </>
                )}
              </p>
            </div>
            <Button
              size="sm"
              variant={refreshStatus.kind === 'stale' ? 'danger-soft' : 'secondary'}
              onPress={refresh}
              isDisabled={isRefreshing}
              aria-label="라이브 상태 새로고침"
            >
              <RefreshCw
                className={`size-3.5 ${isRefreshing || !lastUpdatedAt ? 'animate-spin' : ''}`}
                aria-hidden
              />
              <span aria-live="polite">{refreshStatus.text}</span>
            </Button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2.5">
            <div className="-mx-3 flex min-w-0 items-center gap-1.5 overflow-x-auto px-3 pb-0.5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
            <div className="flex shrink-0 items-center gap-1">
              {[null, ...generations].map((gen) => {
                const isActive = activeGen === gen;
                return (
                  <Button
                    key={gen ?? 'all'}
                    size="sm"
                    variant={isActive ? 'primary' : 'tertiary'}
                    onPress={() => setActiveGen(gen)}
                  >
                    {gen === null ? '전체' : `${gen}기`}
                  </Button>
                );
              })}
            </div>
            <FavoritesOnlyToggle appearance="hero" className="shrink-0" />
            </div>

            <div className="flex min-w-0 flex-1 items-center gap-1">
              <TextField
                aria-label="이름·초성 검색"
                className="min-w-0 flex-1"
                value={search}
                onChange={setSearch}
              >
                <Input placeholder="이름·초성 검색" />
              </TextField>
              {search ? (
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  aria-label="검색어 지우기"
                  onPress={() => setSearch('')}
                >
                  <X className="size-3.5" />
                </Button>
              ) : null}
            </div>
          </div>
        </header>

        <motion.div className="relative z-0 space-y-4 p-3 sm:space-y-8 sm:p-6">
          <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              variants={streamerListPresenceVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Card variant="secondary">
                <Card.Content className="py-10 text-center text-sm">검색 결과가 없어요</Card.Content>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key={listFilterKey}
              variants={streamerListPresenceVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4 sm:space-y-8"
            >
              {liveFiltered.length > 0 && (
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip size="sm" variant="soft" color="danger">
                      방송 중 {liveFiltered.length}
                    </Chip>
                    <span className="hidden text-xs text-zinc-500 sm:inline">
                      카드 우하단 버튼으로 멀티뷰에 추가
                    </span>
                  </div>
                  {cardGrid(liveFiltered)}
                </div>
              )}

              {offlineFiltered.length > 0 && (
                <div className="space-y-2 sm:space-y-3">
                  {liveFiltered.length > 0 && (
                    <Chip size="sm" variant="soft">
                      오프라인
                    </Chip>
                  )}
                  <div className={liveFiltered.length > 0 ? 'opacity-80' : ''}>
                    {cardGrid(offlineFiltered, liveFiltered.length)}
                  </div>
                </div>
              )}
            </motion.div>
          )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
        {selectedOrder.length > 0 && (
          <motion.div
            key="multiview-bar"
            variants={streamerMultiviewBarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="sticky bottom-0 z-20 border-t border-slate-100 bg-white/95 px-3 py-2 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95 sm:px-4 sm:py-4"
          >
            <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-2 sm:gap-3 sm:flex-nowrap">
              <div className="flex shrink-0 items-center gap-1.5">
                {selectedOrder.map((id, index) => {
                  const streamer = streamerMap.get(id);
                  if (!streamer) return null;
                  const color = getStreamerColor(streamer.id, isDark) ?? streamer.colorCode;
                  return (
                    <div
                      key={id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, id)}
                      onDragOver={(e) => handleDragOver(e, id)}
                      onDrop={(e) => handleDrop(e, id)}
                      onDragLeave={() => setDragOverId(null)}
                      title={`${index + 1}번: ${streamer.name} — 드래그로 순서 변경`}
                      className={`relative cursor-grab select-none transition-all active:cursor-grabbing ${
                        dragOverId === id ? 'scale-110 opacity-50' : 'hover:scale-105'
                      }`}
                    >
                      <span className="absolute -right-1.5 -top-1.5 z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-600 text-[8px] font-black leading-none text-white shadow-sm">
                        {index + 1}
                      </span>
                      <div className="h-7 w-7 overflow-hidden rounded-lg border-2 border-white shadow-sm dark:border-slate-900">
                        <StreamerAvatar
                          name={streamer.name}
                          imgSrc={streamer.profileImg ?? getStreamerImagePath(streamer.name)}
                          colorCode={color}
                          streamerId={streamer.id}
                          size="xs"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden h-5 w-px shrink-0 bg-slate-200 dark:bg-slate-700 sm:block" />

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 sm:text-sm">
                  <span className="font-black text-slate-800 dark:text-white">{selectedOrder.length}명</span>{' '}
                  선택됨
                  {isMaxReached ? (
                    <Chip size="sm" variant="soft" color="warning" className="ml-1.5">
                      최대 {MAX_STREAMS}명
                    </Chip>
                  ) : null}
                </p>
              </div>
              <Button size="sm" variant="ghost" onPress={clearSelection}>
                선택 해제
              </Button>
              <Button size="sm" onPress={startMultiview}>
                <LayoutGrid className="size-4" />
                멀티뷰 시작
              </Button>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {requestTarget && (
          <RequestEditModal streamer={requestTarget} onClose={handleClose} />
        )}
      </AnimatePresence>
    </>
  );
}
