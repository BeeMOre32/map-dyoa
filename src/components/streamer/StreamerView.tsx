'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, LayoutGrid, WifiOff } from 'lucide-react';
import { Streamer } from '@prisma/client';
import { useTheme } from 'next-themes';
import RequestEditModal from '../Form/RequestEdit';
import StreamerCard from './StreamerCard';
import StreamerAvatar from './StreamerAvatar';
import { useChosungSearch } from '@/hooks/useChosungSearch';
import { useLiveStatus } from '@/hooks/useLiveStatus';
import { MAX_STREAMS } from '@/components/multiview/utils';
import { getStreamerColor } from '@/constants/streamercolor';
import { getStreamerImagePath } from '@/lib/utils';
import { track } from '@vercel/analytics';

export default function StreamerView({ streamers }: { streamers: Streamer[] }) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [requestTarget, setRequestTarget] = useState<Streamer | null>(null);
  const [activeGen, setActiveGen] = useState<number | null>(null);
  // 선택 순서를 유지하는 배열 (Set 대신 Array)
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const { liveIds } = useLiveStatus();

  const generations = useMemo(
    () => [...new Set(streamers.map((s) => s.generation))].sort((a, b) => a - b),
    [streamers],
  );

  const genFilter = useCallback(
    (s: Streamer) => activeGen === null || s.generation === activeGen,
    [activeGen],
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

  const cardGrid = (list: Streamer[], delayBase = 0) => (
    <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <AnimatePresence mode="popLayout">
        {list.map((streamer, i) => {
          const idx = selectedOrder.indexOf(streamer.id);
          return (
            <motion.div
              key={streamer.id}
              layout
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1, transition: { delay: (i + delayBase) * 0.04, duration: 0.2, ease: 'easeOut' } }}
              exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.15 } }}
            >
              <StreamerCard
                streamer={streamer}
                onRequestEdit={handleRequestEdit}
                isLive={liveIds.has(streamer.id)}
                isSelected={idx >= 0}
                isMaxReached={isMaxReached}
                onToggleMultiview={() => toggleSelect(streamer.id)}
                selectionIndex={idx >= 0 ? idx + 1 : undefined}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );

  return (
    // overflow-clip: 스크롤 시 카드 내용이 둥근 모서리 밖으로 보이는 버그 수정
    // (overflow-hidden 과 달리 sticky 포지셔닝에 영향을 주지 않음)
    <div
      className="flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800 relative"
      style={{ overflow: 'clip' }}
    >
      {/* 헤더 — rounded-t-3xl 제거: 스크롤 시 카드가 헤더 모서리 투명 영역으로 보이는 버그 수정 */}
      <div className="sticky top-0 z-10 p-6 pb-4 border-b border-slate-50 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-800 dark:text-white">
            참여 방송인 목록
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            {search || activeGen !== null
              ? `${filtered.length}명 검색됨`
              : liveFiltered.length > 0
                ? <><span className="text-red-500 font-black">{liveFiltered.length}명</span> 라이브 중 · 총 {streamers.length}명</>
                : `총 ${streamers.length}명의 방송인이 지도동과 함께합니다.`}
          </p>
        </div>

        {/* 필터 + 검색 */}
        <div className="flex items-center gap-2 flex-wrap">
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
      <div className="p-6 space-y-8">
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-3xl"
          >
            <p className="text-slate-400 dark:text-slate-500 font-bold">검색 결과가 없어요</p>
          </motion.div>
        ) : (
          <>
            {/* 라이브 중 섹션 */}
            {liveFiltered.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex w-2 h-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full w-2 h-2 bg-red-500" />
                  </span>
                  <p className="text-xs font-black text-red-500 uppercase tracking-widest">
                    라이브 중
                  </p>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-800/50">
                    {liveFiltered.length}명
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-600 font-medium ml-1">
                    카드 우하단 <LayoutGrid className="inline w-2.5 h-2.5 mb-0.5" /> 버튼으로 멀티뷰에 추가
                  </span>
                </div>
                {cardGrid(liveFiltered, 0)}
              </div>
            )}

            {/* 오프라인 섹션 */}
            {offlineFiltered.length > 0 && (
              <div className="space-y-3">
                {liveFiltered.length > 0 && (
                  <div className="flex items-center gap-2">
                    <WifiOff className="w-3 h-3 text-slate-400" />
                    <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      오프라인
                    </p>
                  </div>
                )}
                <div className={liveFiltered.length > 0 ? 'opacity-80' : ''}>
                  {cardGrid(offlineFiltered, liveFiltered.length)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 멀티뷰 선택 플로팅 바 */}
      <AnimatePresence>
        {selectedOrder.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="sticky bottom-0 mx-6 mb-6"
          >
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/60 dark:shadow-slate-900/60 flex-wrap sm:flex-nowrap">

              <div className="flex items-center gap-1.5 shrink-0">
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
                      className={`relative cursor-grab active:cursor-grabbing transition-all select-none ${
                        dragOverId === id ? 'scale-110 opacity-50' : 'hover:scale-105'
                      }`}
                    >
                      <span className="absolute -top-1.5 -right-1.5 z-10 w-3.5 h-3.5 rounded-full bg-indigo-600 text-white text-[8px] font-black flex items-center justify-center leading-none shadow-sm">
                        {index + 1}
                      </span>
                      <div className="w-7 h-7 rounded-lg overflow-hidden border-2 border-white dark:border-slate-900 shadow-sm">
                        <StreamerAvatar
                          name={streamer.name}
                          imgSrc={getStreamerImagePath(streamer.name)}
                          colorCode={color}
                          streamerId={streamer.id}
                          size="xs"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden sm:block w-px h-5 bg-slate-200 dark:bg-slate-700 shrink-0" />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  <span className="font-black text-slate-800 dark:text-white">{selectedOrder.length}명</span> 선택됨
                  {isMaxReached && (
                    <span className="ml-2 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">최대 {MAX_STREAMS}명</span>
                  )}
                </p>
              </div>
              <button
                onClick={clearSelection}
                className="px-3 py-1.5 rounded-xl text-xs font-black text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              >
                선택 해제
              </button>
              <button
                onClick={startMultiview}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black transition-colors shadow-lg shadow-indigo-900/20 shrink-0"
              >
                <LayoutGrid className="w-4 h-4" />
                멀티뷰 시작
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {requestTarget && (
          <RequestEditModal streamer={requestTarget} onClose={handleClose} />
        )}
      </AnimatePresence>
    </div>
  );
}
