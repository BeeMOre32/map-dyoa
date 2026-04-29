'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ExternalLink, LayoutGrid, FlaskConical, X,
  Play, Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { getStreamerColor } from '@/constants/streamercolor';
import type { Streamer } from '@prisma/client';
import { getLiveUrl, getPanelRows } from './utils';
import { SelectionScreen } from './SelectionScreen';
import { StreamPanel } from './StreamPanel';
import { ChatPanel } from './ChatPanel';
import { ResizableGrid } from './ResizableGrid';
import { ResizableFocusLayout } from './ResizableFocusLayout';

interface MultiViewProps {
  participants: Streamer[];
  title: string;
  backHref: string;
}

export default function MultiView({ participants, title, backHref }: MultiViewProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [phase, setPhase] = useState<'select' | 'watch'>('select');
  const [order, setOrder] = useState<string[]>(participants.map((p) => p.id));
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [chatStreamerId, setChatStreamerId] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setToast(true), 800);
    const hide = setTimeout(() => setToast(false), 6800);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, []);

  const orderedVisible = useMemo(
    () => order
      .filter((id) => visible.has(id))
      .map((id) => participants.find((p) => p.id === id))
      .filter((p): p is Streamer => !!p),
    [order, visible, participants],
  );

  const hiddenInWatch = phase === 'watch'
    ? participants.filter((p) => !visible.has(p.id))
    : [];

  const allLoaded = orderedVisible.length > 0 && orderedVisible.every((s) => loaded.has(s.id));
  const focusedStreamer = focusedId ? orderedVisible.find((p) => p.id === focusedId) ?? null : null;
  const otherStreamers = focusedStreamer ? orderedVisible.filter((p) => p.id !== focusedId) : [];

  const handleStart = (selectedIds: string[]) => {
    setVisible(new Set(selectedIds));
    setLoaded(new Set(selectedIds));
    setPhase('watch');
  };

  const hidePanel = (id: string) => {
    setVisible((prev) => { const n = new Set(prev); n.delete(id); return n; });
    setLoaded((prev) => { const n = new Set(prev); n.delete(id); return n; });
    if (focusedId === id) setFocusedId(null);
    if (chatStreamerId === id) setChatStreamerId(null);
  };

  const restore = (id: string) => setVisible((prev) => new Set([...prev, id]));
  const load = (id: string) => setLoaded((prev) => new Set([...prev, id]));
  const loadAll = () => setLoaded(new Set([...visible]));

  const swapVisible = (id: string, dir: -1 | 1) => {
    const visIdx = orderedVisible.findIndex((p) => p.id === id);
    const targetIdx = visIdx + dir;
    if (targetIdx < 0 || targetIdx >= orderedVisible.length) return;
    const targetId = orderedVisible[targetIdx].id;
    setOrder((prev) => {
      const next = [...prev];
      const a = next.indexOf(id);
      const b = next.indexOf(targetId);
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
  };

  const openAll = () => {
    participants
      .filter((s) => visible.has(s.id))
      .forEach((s) => window.open(getLiveUrl(s), '_blank', 'noopener,noreferrer'));
  };

  const renderStreamPanel = (streamer: Streamer, isFocused: boolean) => {
    const idx = orderedVisible.indexOf(streamer);
    return (
      <StreamPanel
        streamer={streamer}
        isLoaded={loaded.has(streamer.id)}
        isFocused={isFocused}
        canLeft={idx > 0}
        canRight={idx < orderedVisible.length - 1}
        onLoad={() => load(streamer.id)}
        onHide={() => hidePanel(streamer.id)}
        onToggleFocus={() => setFocusedId(isFocused ? null : streamer.id)}
        onSwapLeft={() => swapVisible(streamer.id, -1)}
        onSwapRight={() => swapVisible(streamer.id, 1)}
        onOpenChat={() => setChatStreamerId(streamer.id)}
      />
    );
  };

  const watchContent = () => {
    if (orderedVisible.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-600">
          <LayoutGrid className="w-10 h-10" />
          <p className="text-sm font-black">표시할 패널이 없습니다</p>
          <p className="text-xs font-medium text-slate-700">위의 칩을 눌러 스트리머를 복원하세요</p>
        </div>
      );
    }
    if (focusedStreamer) {
      return (
        <ResizableFocusLayout
          focused={focusedStreamer}
          others={otherStreamers}
          renderPanel={renderStreamPanel}
        />
      );
    }
    return (
      <ResizableGrid
        rows={getPanelRows(orderedVisible)}
        renderPanel={(s) => renderStreamPanel(s, false)}
      />
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      <div className="shrink-0 flex items-center gap-2 px-3 h-12 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800">
        {phase === 'select' ? (
          <Link href={backHref}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        ) : (
          <button
            onClick={() => { setPhase('select'); setLoaded(new Set()); setFocusedId(null); setChatStreamerId(null); }}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
            title="스트리머 다시 선택"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <LayoutGrid className="w-4 h-4 text-indigo-400 shrink-0" />
        <span className="text-sm font-black text-white truncate min-w-0 flex-1">{title}</span>

        {phase === 'watch' && (
          <AnimatePresence mode="popLayout">
            {hiddenInWatch.map((s) => {
              const color = getStreamerColor(s.id, isDark) ?? s.colorCode;
              return (
                <motion.button
                  key={s.id}
                  layout
                  initial={{ scale: 0.75, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.75, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={() => restore(s.id)}
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

        {phase === 'watch' && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={allLoaded ? () => setLoaded(new Set()) : loadAll}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-black rounded-lg transition-colors">
              <Play className="w-3 h-3" />
              <span className="hidden sm:inline">{allLoaded ? '모두 끄기' : '모두 시작'}</span>
            </button>
            <button onClick={openAll}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-lg transition-colors">
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">전체 열기</span>
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {toast && (
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
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  오류 제보 및 피드백은 환영합니다 :)
                </p>
              </div>
              <button onClick={() => setToast(false)}
                className="shrink-0 p-1.5 text-slate-600 hover:text-slate-400 hover:bg-slate-700 rounded-xl transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {phase === 'select' ? (
          <motion.div
            key="select"
            className="flex-1 flex flex-col min-h-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <SelectionScreen
              title={title}
              participants={participants}
              onStart={handleStart}
            />
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
            {chatStreamerId && (
              <ChatPanel
                streamers={orderedVisible}
                chatStreamerId={chatStreamerId}
                onClose={() => setChatStreamerId(null)}
                onSwitch={setChatStreamerId}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
