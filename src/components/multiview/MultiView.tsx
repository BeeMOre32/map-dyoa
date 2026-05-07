'use client';

import Link from 'next/link';
import {
  ArrowLeft, ExternalLink, LayoutGrid, FlaskConical, X, Play, Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { getStreamerColor } from '@/constants/streamercolor';
import type { Streamer } from '@prisma/client';
import { getPanelRows } from './utils';
import { SelectionScreen } from './SelectionScreen';
import { StreamPanel } from './StreamPanel';
import { ChatPanel } from './ChatPanel';
import { ResizableGrid } from './ResizableGrid';
import { ResizableFocusLayout } from './ResizableFocusLayout';
import { useMultiViewState } from '@/hooks/useMultiViewState';

interface MultiViewProps {
  participants: Streamer[];
  title: string;
  backHref: string;
}

export default function MultiView({ participants, title, backHref }: MultiViewProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const mv = useMultiViewState(participants);

  const renderStreamPanel = (streamer: Streamer, isFocused: boolean) => {
    const idx = mv.orderedVisible.indexOf(streamer);
    return (
      <StreamPanel
        streamer={streamer}
        isLoaded={mv.loaded.has(streamer.id)}
        isFocused={isFocused}
        canLeft={idx > 0}
        canRight={idx < mv.orderedVisible.length - 1}
        onLoad={() => mv.load(streamer.id)}
        onHide={() => mv.hidePanel(streamer.id)}
        onToggleFocus={() => mv.setFocusedId(mv.focusedId === streamer.id ? null : streamer.id)}
        onSwapLeft={() => mv.swapVisible(streamer.id, -1)}
        onSwapRight={() => mv.swapVisible(streamer.id, 1)}
        onOpenChat={() => mv.setChatStreamerId(streamer.id)}
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
        />
      );
    }
    return (
      <ResizableGrid
        rows={getPanelRows(mv.orderedVisible)}
        renderPanel={(s) => renderStreamPanel(s, false)}
      />
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      {/* 상단 바 */}
      <div className="shrink-0 flex items-center gap-2 px-3 h-12 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800">
        {mv.phase === 'select' ? (
          <Link href={backHref} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        ) : (
          <button
            onClick={mv.exitToSelect}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
            title="스트리머 다시 선택"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <LayoutGrid className="w-4 h-4 text-indigo-400 shrink-0" />
        <span className="text-sm font-black text-white truncate min-w-0 flex-1">{title}</span>

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
                  style={{ backgroundColor: color }}
                  title={`${s.name} 복원`}
                >
                  <Plus className="w-3 h-3" />
                  <span className="hidden sm:inline">{s.name}</span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        )}

        {mv.phase === 'watch' && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={mv.allLoaded ? mv.unloadAll : mv.loadAll}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-black rounded-lg transition-colors"
            >
              <Play className="w-3 h-3" />
              <span className="hidden sm:inline">{mv.allLoaded ? '모두 끄기' : '모두 시작'}</span>
            </button>
            <button
              onClick={mv.openAll}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-lg transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">전체 열기</span>
            </button>
          </div>
        )}
      </div>

      {/* 실험 기능 토스트 */}
      <AnimatePresence>
        {mv.toast && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="fixed bottom-6 right-4 sm:right-6 z-200 max-w-xs w-[calc(100vw-2rem)] sm:w-80"
          >
            <div className="bg-slate-800 border border-slate-700 rounded-[1.75rem] shadow-2xl shadow-black/60 p-4 flex items-start gap-3.5">
              <div className="shrink-0 p-2 bg-amber-500/15 text-amber-400 rounded-2xl">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white mb-0.5">실험중인 기능입니다</p>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">오류 제보 및 피드백은 환영합니다 :)</p>
              </div>
              <button
                onClick={() => mv.setToast(false)}
                className="shrink-0 p-1.5 text-slate-600 hover:text-slate-400 hover:bg-slate-700 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            className="flex-1 flex min-h-0 min-w-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex-1 flex flex-col min-h-0 min-w-0">
              {watchContent()}
            </div>
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
