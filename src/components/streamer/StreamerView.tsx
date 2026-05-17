'use client';

import { AnimatePresence } from 'framer-motion';
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, LayoutGrid, WifiOff, RefreshCw, Star } from 'lucide-react';
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

export default function StreamerView({
  streamers,
  initialLiveIds,
  initialLiveFetchedAt,
}: {
  streamers: Streamer[];
  initialLiveIds?: string[];
  /** RSC에서 라이브 목록을 가져온 시각(ms). hydration 시각 텍스트 일치용 */
  initialLiveFetchedAt?: number;
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

  const { liveIds, isRefreshing, lastUpdatedAt } = useLiveStatus(
    initialLiveIds,
    initialLiveFetchedAt,
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

    return {
      kind: 'done' as const,
      // Node·브라우저 locale 차이(PM vs 오후)로 hydration mismatch 방지 — 24시간 고정 포맷
      text: `${format(new Date(lastUpdatedAt), 'HH:mm')} 갱신`,
    };
  }, [isRefreshing, lastUpdatedAt]);

  const cardGrid = (list: Streamer[]) => (
    <div className="relative z-0 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {list.map((streamer) => {
        const idx = selectedOrder.indexOf(streamer.id);
        return (
          <div key={streamer.id} className="relative z-0">
            <StreamerCard
              streamer={streamer}
              onRequestEdit={handleRequestEdit}
              isLive={liveIds.has(streamer.id)}
              isSelected={idx >= 0}
              isMaxReached={isMaxReached}
              onToggleMultiview={() => toggleSelect(streamer.id)}
              selectionIndex={idx >= 0 ? idx + 1 : undefined}
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {/* sticky는 근처 스크롤 조상(layout overflow-y-auto) 안에서 동작하도록 카드에는 overflow:hidden 미사용 */}
      <div className="flex flex-col rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-900/50">
        <header className="sticky top-0 z-30 shrink-0 border-b border-slate-100 bg-white px-5 py-5 shadow-[0_8px_16px_-10px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_10px_24px_-12px_rgba(0,0,0,0.45)] sm:p-6 sm:pb-4">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-black tracking-tight text-slate-800 dark:text-white sm:text-xl md:text-2xl">
                멤버
              </h2>
              <p className="mt-1.5 text-[11px] font-bold leading-relaxed text-slate-500 dark:text-slate-400 sm:text-xs">
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
            <div
              className={`flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black transition-all sm:text-xs ${
                refreshStatus.kind === 'done'
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-400'
              }`}
              aria-live="polite"
            >
              <RefreshCw
                className={`h-3 w-3 ${isRefreshing || !lastUpdatedAt ? 'animate-spin' : ''}`}
                aria-hidden
              />
              <span>{refreshStatus.text}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex w-fit max-w-full flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              {[null, ...generations].map((gen) => {
                const isActive = activeGen === gen;
                return (
                  <button
                    key={gen ?? 'all'}
                    type="button"
                    onClick={() => setActiveGen(gen)}
                    className={`relative z-10 rounded-lg px-3 py-1.5 text-xs font-black transition-colors ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                    }`}
                  >
                    {isActive && (
                      <span
                        className="absolute inset-0 rounded-lg bg-indigo-600"
                        aria-hidden
                      />
                    )}
                    <span className="relative z-10">{gen === null ? '전체' : `${gen}기`}</span>
                  </button>
                );
              })}
            </div>
            <FavoritesOnlyToggle className="py-2 text-xs" />
            </div>

            <div className="flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <Search className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="이름·초성 검색"
                className="min-w-0 flex-1 bg-transparent text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500 sm:text-sm"
              />
              {!!search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-slate-300 hover:text-slate-500 dark:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="relative z-0 space-y-8 p-6">
          {filtered.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-100 py-20 text-center dark:border-slate-700">
              <p className="font-bold text-slate-400 dark:text-slate-500">검색 결과가 없어요</p>
            </div>
          ) : (
            <>
              {liveFiltered.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                    </span>
                    <p className="text-xs font-black tracking-wide text-red-600 dark:text-red-400">방송 중</p>
                    <span className="rounded-full border border-red-100 bg-red-50 px-1.5 py-0.5 text-[10px] font-black text-red-500 dark:border-red-800/50 dark:bg-red-900/30 dark:text-red-400">
                      {liveFiltered.length}명
                    </span>
                    <span className="ml-1 text-[10px] font-medium text-slate-400 dark:text-slate-600">
                      카드 우하단 <LayoutGrid className="mb-0.5 inline h-2.5 w-2.5" /> 버튼으로 멀티뷰에 추가
                    </span>
                  </div>
                  {cardGrid(liveFiltered)}
                </div>
              )}

              {offlineFiltered.length > 0 && (
                <div className="space-y-3">
                  {liveFiltered.length > 0 && (
                    <div className="flex items-center gap-2">
                      <WifiOff className="h-3 w-3 text-slate-400" />
                      <p className="text-xs font-black tracking-wide text-slate-500 dark:text-slate-400">
                        오프라인
                      </p>
                    </div>
                  )}
                  <div className={liveFiltered.length > 0 ? 'opacity-80' : ''}>
                    {cardGrid(offlineFiltered)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {selectedOrder.length > 0 && (
          <div className="sticky bottom-0 z-20 border-t border-slate-100 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-3 sm:flex-nowrap">
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
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  <span className="font-black text-slate-800 dark:text-white">{selectedOrder.length}명</span>{' '}
                  선택됨
                  {isMaxReached && (
                    <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                      최대 {MAX_STREAMS}명
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={clearSelection}
                className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-black text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                선택 해제
              </button>
              <button
                type="button"
                onClick={startMultiview}
                className="flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-indigo-900/20 transition-colors hover:bg-indigo-500"
              >
                <LayoutGrid className="h-4 w-4" />
                멀티뷰 시작
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {requestTarget && (
          <RequestEditModal streamer={requestTarget} onClose={handleClose} />
        )}
      </AnimatePresence>
    </>
  );
}
