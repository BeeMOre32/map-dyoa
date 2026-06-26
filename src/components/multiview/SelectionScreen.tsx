'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutGrid, Check, Play, Puzzle, ExternalLink, Radio } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@teispace/next-themes';
import { getStreamerColor } from '@/constants/streamercolor';
import type { Streamer } from '@prisma/client';
import StreamerAvatar from '@/components/streamer/StreamerAvatar';
import { useLiveStatus } from '@/hooks/useLiveStatus';
import { MAX_STREAMS } from './utils';
import { CHROME_EXTENSION_URL } from '@/constants/extension';

export function SelectionScreen({
  title,
  participants,
  onStart,
}: {
  title: string;
  participants: Streamer[];
  onStart: (ids: string[]) => void;
}) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { liveIds, isLoading: liveLoading } = useLiveStatus();

  const liveParticipantIds = participants.filter((p) => liveIds.has(p.id)).map((p) => p.id);
  const defaultSelection =
    liveParticipantIds.length > 0
      ? liveParticipantIds.slice(0, MAX_STREAMS)
      : participants.slice(0, MAX_STREAMS).map((p) => p.id);

  const [selected, setSelected] = useState<string[]>(defaultSelection);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < MAX_STREAMS
          ? [...prev, id]
          : prev,
    );
  };

  const selectAll = () => setSelected(participants.slice(0, MAX_STREAMS).map((p) => p.id));
  const clearAll = () => setSelected([]);
  const selectLiveOnly = () => {
    if (liveParticipantIds.length === 0) return;
    setSelected(liveParticipantIds.slice(0, MAX_STREAMS));
  };

  const liveCount = liveParticipantIds.length;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-indigo-400 shrink-0" />
            <h2 className="text-lg font-black text-white">멀티뷰 시청</h2>
            {!liveLoading && liveCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-black">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                LIVE {liveCount}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 font-medium truncate pl-7">{title}</p>
          <p className="text-xs text-slate-600 font-medium pl-7">
            시청할 스트리머를 선택하세요 · 최대 {MAX_STREAMS}명
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {participants.map((s) => {
            const color = getStreamerColor(s.id, isDark) ?? s.colorCode;
            const isSelected = selected.includes(s.id);
            const isDisabled = !isSelected && selected.length >= MAX_STREAMS;
            const isLive = liveIds.has(s.id);

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                disabled={isDisabled}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors ${
                  isDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-800'
                }`}
              >
                <div
                  className="relative w-12 h-12 shrink-0 transition-all duration-200"
                  style={{
                    boxShadow: isSelected ? `0 0 0 2px #0f172a, 0 0 0 4px ${color}` : 'none',
                  }}
                >
                  <StreamerAvatar
                    name={s.name}
                    imgSrc={s.profileImg}
                    colorCode={color}
                    streamerId={s.id}
                    size="small"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40">
                      <Check className="w-5 h-5 text-white" strokeWidth={3} />
                    </div>
                  )}
                  {isLive && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-red-500 text-white text-[8px] font-black leading-none">
                      <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                      LIVE
                    </span>
                  )}
                </div>
                <span
                  className={`text-[11px] font-bold text-center line-clamp-1 w-full transition-colors ${
                    isSelected ? 'text-white' : 'text-slate-500'
                  }`}
                >
                  {s.name}
                </span>
              </button>
            );
          })}
        </div>

        <a
          href={CHROME_EXTENSION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 transition-colors group"
        >
          <Puzzle className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-black text-amber-400 leading-none mb-0.5">
              채팅 확장 프로그램 설치
            </p>
            <p className="text-[10px] text-amber-300/60 font-medium">
              채팅 기능을 사용하려면 Chrome 확장 프로그램이 필요합니다
            </p>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-amber-500 group-hover:text-amber-300 shrink-0 transition-colors" />
        </a>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-slate-500">
              <span className="text-white font-black">{selected.length}</span>명 선택
            </span>
            {selected.length >= MAX_STREAMS && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                최대
              </span>
            )}
            <button
              type="button"
              onClick={selected.length > 0 ? clearAll : selectAll}
              className="text-[11px] font-black text-slate-600 hover:text-slate-400 transition-colors"
            >
              {selected.length > 0 ? '전체 해제' : '전체 선택'}
            </button>
            {liveCount > 0 && (
              <button
                type="button"
                onClick={selectLiveOnly}
                className="flex items-center gap-1 text-[11px] font-black text-red-400/80 hover:text-red-300 transition-colors"
              >
                <Radio className="w-3 h-3" />
                LIVE만 선택
              </button>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 rounded-2xl border border-slate-700 text-slate-400 text-sm font-black hover:bg-slate-800 transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => selected.length > 0 && onStart(selected)}
              disabled={selected.length === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/40"
            >
              <Play className="w-4 h-4" />
              시청 시작
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
