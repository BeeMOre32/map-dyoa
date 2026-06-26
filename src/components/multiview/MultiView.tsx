'use client';

import Link from 'next/link';
import { useCallback, useEffect } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  LayoutGrid,
  Play,
  Plus,
  Pin,
  PinOff,
  Rows3,
  Grid2x2,
  LayoutList,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@teispace/next-themes';
import { getStreamerColor } from '@/constants/streamercolor';
import type { Streamer } from '@prisma/client';
import { getPanelRows, type LayoutPreset } from './utils';
import { SelectionScreen } from './SelectionScreen';
import { StreamPanel } from './StreamPanel';
import { ChatPanel } from './ChatPanel';
import { ResizableGrid } from './ResizableGrid';
import { ResizableFocusLayout } from './ResizableFocusLayout';
import { MultiviewSelectCoach, MultiviewWatchCoach } from './MultiviewCoach';
import { useMultiViewState } from '@/hooks/useMultiViewState';
import { useLiveStatus } from '@/hooks/useLiveStatus';

interface MultiViewProps {
  participants: Streamer[];
  title: string;
  backHref: string;
  /** URL로 진입 시 선택 화면 생략 */
  autoStart?: boolean;
}

const LAYOUT_PRESETS: { id: LayoutPreset; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'auto', label: '자동', icon: LayoutGrid },
  { id: 'balanced', label: '균등', icon: Grid2x2 },
  { id: 'single-row', label: '1행', icon: LayoutList },
];

export default function MultiView({ participants, title, backHref, autoStart }: MultiViewProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const mv = useMultiViewState(participants, { autoStart });
  const { liveIds } = useLiveStatus();

  const handleGridLayoutChange = useCallback(
    (layout: { rowH: number[]; colB: number[][] }) => {
      mv.setGridLayout({ rowH: layout.rowH, colB: layout.colB });
    },
    [mv.setGridLayout],
  );

  const handleFocusLayoutChange = useCallback(
    (layout: { split: number; sideH: number[] }) => {
      mv.setFocusLayout({ split: layout.split, sideH: layout.sideH });
    },
    [mv.setFocusLayout],
  );

  const renderStreamPanel = (streamer: Streamer, isFocused: boolean) => {
    const idx = mv.orderedVisible.indexOf(streamer);
    return (
      <StreamPanel
        streamer={streamer}
        isLoaded={mv.loaded.has(streamer.id)}
        isFocused={isFocused}
        isMuted={mv.mutedIds.has(streamer.id)}
        isLive={liveIds.has(streamer.id)}
        pinControls={mv.pinControls}
        canLeft={idx > 0}
        canRight={idx < mv.orderedVisible.length - 1}
        onLoad={() => mv.load(streamer.id)}
        onHide={() => mv.hidePanel(streamer.id)}
        onToggleFocus={() => mv.setFocusedId(mv.focusedId === streamer.id ? null : streamer.id)}
        onSwapLeft={() => mv.swapVisible(streamer.id, -1)}
        onSwapRight={() => mv.swapVisible(streamer.id, 1)}
        onToggleMute={() => mv.toggleMute(streamer.id)}
        onSoloAudio={() => mv.muteAllExcept(streamer.id)}
        onOpenChat={() => mv.setChatStreamerId(streamer.id)}
        onDragReorder={(fromId) => mv.reorder(fromId, streamer.id)}
      />
    );
  };

  const watchContent = () => {
    if (mv.orderedVisible.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-600">
          <LayoutGrid className="w-10 h-10" />
          <p className="text-sm font-black">표시할 패널이 없습니다</p>
          <p className="text-xs font-medium text-slate-700">위의 칩을 눌러 스트리머를 복원하세요</p>
        </div>
      );
    }
    if (mv.focusedStreamer) {
      return (
        <ResizableFocusLayout
          focused={mv.focusedStreamer}
          others={mv.otherStreamers}
          renderPanel={renderStreamPanel}
          initialSplit={mv.focusLayout.split}
          initialSideH={mv.focusLayout.sideH}
          onLayoutChange={handleFocusLayoutChange}
        />
      );
    }
    return (
      <ResizableGrid
        rows={getPanelRows(mv.orderedVisible, mv.layoutPreset)}
        renderPanel={(s) => renderStreamPanel(s, false)}
        initialRowH={mv.gridLayout.rowH}
        initialColB={mv.gridLayout.colB}
        onLayoutChange={handleGridLayoutChange}
      />
    );
  };

  // 키보드 단축키
  useEffect(() => {
    if (mv.phase !== 'watch') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      if (e.key === 'Escape') {
        if (mv.chatStreamerId) mv.setChatStreamerId(null);
        else if (mv.focusedId) mv.setFocusedId(null);
        return;
      }
      if (e.key === 'p' || e.key === 'P') {
        mv.setPinControls((v) => !v);
        return;
      }
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        mv.focusByIndex(num - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    mv.phase,
    mv.chatStreamerId,
    mv.focusedId,
    mv.setChatStreamerId,
    mv.setFocusedId,
    mv.setPinControls,
    mv.focusByIndex,
  ]);

  const liveVisibleCount = mv.orderedVisible.filter((s) => liveIds.has(s.id)).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      {/* 상단 바 */}
      <div className="shrink-0 flex items-center gap-2 px-3 h-12 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800">
        {mv.phase === 'select' ? (
          <Link
            href={backHref}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={mv.exitToSelect}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
            title="스트리머 다시 선택"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <LayoutGrid className="w-4 h-4 text-indigo-400 shrink-0" />
        <span className="text-sm font-black text-white truncate min-w-0 flex-1">{title}</span>

        {mv.phase === 'watch' && liveVisibleCount > 0 && (
          <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-black shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            LIVE {liveVisibleCount}
          </span>
        )}

        {mv.phase === 'watch' && (
          <AnimatePresence mode="popLayout">
            {mv.hiddenInWatch.map((s) => {
              const color = getStreamerColor(s.id, isDark) ?? s.colorCode;
              return (
                <motion.button
                  key={s.id}
                  layout
                  initial={{ scale: 0.75, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.75, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={() => mv.restore(s.id)}
                  className="flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-full text-[10px] font-black text-white shrink-0 hover:opacity-80 transition-opacity"
                  style={{ display: 'flex', backgroundColor: color }}
                  title={`${s.name} 복원 (시청은 패널에서 시작)`}
                >
                  <Plus className="w-3 h-3" />
                  <span className="hidden sm:inline">{s.name}</span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        )}

        {mv.phase === 'watch' && !mv.focusedStreamer && (
          <div className="hidden md:flex items-center gap-0.5 shrink-0">
            {LAYOUT_PRESETS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => mv.setLayoutPreset(id)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black transition-colors ${
                  mv.layoutPreset === id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                }`}
                title={`레이아웃: ${label}`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        )}

        {mv.phase === 'watch' && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => mv.setPinControls((v) => !v)}
              className={`p-1.5 rounded-lg transition-colors ${
                mv.pinControls
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:bg-slate-800 hover:text-white'
              }`}
              title="컨트롤 고정 (P)"
            >
              {mv.pinControls ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={mv.allLoaded ? mv.unloadAll : mv.loadAll}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-black rounded-lg transition-colors"
            >
              <Play className="w-3 h-3" />
              <span className="hidden sm:inline">{mv.allLoaded ? '모두 끄기' : '모두 시작'}</span>
            </button>
            <button
              type="button"
              onClick={mv.openAll}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-lg transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">전체 열기</span>
            </button>
          </div>
        )}
      </div>

      {/* 모바일 레이아웃 프리셋 */}
      {mv.phase === 'watch' && !mv.focusedStreamer && (
        <div className="md:hidden shrink-0 flex items-center gap-1 px-3 py-1.5 border-b border-slate-800 bg-slate-900/60">
          <Rows3 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          {LAYOUT_PRESETS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => mv.setLayoutPreset(id)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-colors ${
                mv.layoutPreset === id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:bg-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {mv.phase === 'select' && <MultiviewSelectCoach />}
      {mv.phase === 'watch' && <MultiviewWatchCoach />}

      {/* 메인 콘텐츠 */}
      <AnimatePresence mode="wait">
        {mv.phase === 'select' ? (
          <motion.div
            key="select"
            className="flex-1 flex flex-col min-h-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <SelectionScreen title={title} participants={participants} onStart={mv.handleStart} />
          </motion.div>
        ) : (
          <motion.div
            key="watch"
            className="flex-1 flex flex-col sm:flex-row min-h-0 min-w-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex-1 flex flex-col min-h-0 min-w-0">{watchContent()}</div>
            {mv.chatStreamerId && (
              <ChatPanel
                streamers={mv.orderedVisible}
                chatStreamerId={mv.chatStreamerId}
                onClose={() => mv.setChatStreamerId(null)}
                onSwitch={mv.setChatStreamerId}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
