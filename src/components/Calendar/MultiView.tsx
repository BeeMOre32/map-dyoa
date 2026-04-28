'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, LayoutGrid, FlaskConical, X, Play, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { getStreamerColor } from '@/constants/streamercolor';
import type { Streamer } from '@prisma/client';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';

interface MultiViewProps {
  schedule: FlattenedSchedule;
}

function getLiveUrl(streamer: Streamer): string {
  if (streamer.chzzkUrl) return streamer.chzzkUrl;
  return `https://chzzk.naver.com/${streamer.handle}`;
}

const GRID_COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2',
  4: 'grid-cols-1 sm:grid-cols-2',
  5: 'grid-cols-1 sm:grid-cols-3',
  6: 'grid-cols-1 sm:grid-cols-3',
};

export default function MultiView({ schedule }: MultiViewProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  // 로드된 패널만 iframe을 렌더링 — 초기엔 아무것도 로드하지 않음
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setToast(true), 800);
    const hide = setTimeout(() => setToast(false), 6800);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, []);

  const participants = schedule.participants;
  const gridColClass = GRID_COLS[Math.min(participants.length, 6)] ?? 'grid-cols-1 sm:grid-cols-4';

  const load = (id: string) => setLoaded((prev) => new Set([...prev, id]));
  const unload = (id: string) => setLoaded((prev) => { const n = new Set(prev); n.delete(id); return n; });
  const loadAll = () => setLoaded(new Set(participants.map((s) => s.id)));

  const openAll = () => {
    participants.forEach((s) => window.open(getLiveUrl(s), '_blank', 'noopener,noreferrer'));
  };

  const allLoaded = participants.every((s) => loaded.has(s.id));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      {/* 헤더 */}
      <div className="h-12 shrink-0 flex items-center gap-3 px-4 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800">
        <Link
          href={`/calendar/schedule/${schedule.id}`}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <LayoutGrid className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-sm font-black text-white truncate">{schedule.title}</span>
          <span className="text-[10px] font-black text-slate-500 bg-slate-800 px-2 py-0.5 rounded-md shrink-0">
            {participants.length}명
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* 모두 시작 / 모두 끄기 */}
          <button
            onClick={allLoaded ? () => setLoaded(new Set()) : loadAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-black rounded-lg transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{allLoaded ? '모두 끄기' : '모두 시작'}</span>
          </button>

          {/* 전체 새 탭으로 열기 */}
          <button
            onClick={openAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">전체 열기</span>
          </button>
        </div>
      </div>

      {/* 실험 기능 토스트 */}
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
              <button
                onClick={() => setToast(false)}
                className="shrink-0 p-1.5 text-slate-600 hover:text-slate-400 hover:bg-slate-700 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 스트림 그리드 */}
      <div className={`flex-1 grid ${gridColClass} gap-px bg-slate-800 min-h-0`}>
        {participants.map((streamer) => {
          const color = getStreamerColor(streamer.id, isDark) ?? streamer.colorCode;
          const liveUrl = getLiveUrl(streamer);
          const isLoaded = loaded.has(streamer.id);

          return (
            <div key={streamer.id} className="relative bg-slate-950 overflow-hidden group/panel min-h-0">

              {/* 플레이스홀더 카드 (미로드 상태) */}
              <AnimatePresence>
                {!isLoaded && (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer"
                    style={{ background: `linear-gradient(135deg, ${color}22, ${color}0a)` }}
                    onClick={() => load(streamer.id)}
                  >
                    <div
                      className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-black text-white shadow-lg"
                      style={{ backgroundColor: color, boxShadow: `0 8px 32px ${color}50` }}
                    >
                      {streamer.name[0]}
                    </div>
                    <p className="text-white font-black text-base">{streamer.name}</p>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white text-sm font-black shadow-md"
                      style={{ backgroundColor: color }}
                    >
                      <PlayCircle className="w-4 h-4" />
                      시청 시작
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* iframe — 로드된 경우에만 렌더링 */}
              {isLoaded && (
                <iframe
                  src={liveUrl}
                  className="w-full h-full border-none"
                  allow="autoplay; fullscreen; picture-in-picture"
                  title={streamer.name}
                />
              )}

              {/* 오버레이 바 (상단, hover 시 표시) */}
              <div className="absolute top-0 left-0 right-0 flex items-center gap-2 px-3 py-2.5 bg-linear-to-b from-black/70 to-transparent opacity-0 group-hover/panel:opacity-100 transition-opacity duration-200 pointer-events-none">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-white text-xs font-black flex-1 truncate">{streamer.name}</span>
                <button
                  onClick={() => isLoaded ? unload(streamer.id) : load(streamer.id)}
                  className="pointer-events-auto text-white/70 hover:text-white text-[10px] font-black px-1.5 py-0.5 bg-white/10 hover:bg-white/20 rounded transition-colors"
                >
                  {isLoaded ? '끄기' : '켜기'}
                </button>
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto p-1 rounded hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* 이름 태그 (좌하단, 항상) */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-white text-[10px] font-black">{streamer.name}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
