'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutGrid, Check, Play, Puzzle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { getStreamerColor } from '@/constants/streamercolor';
import type { Streamer } from '@prisma/client';
import { MAX_STREAMS } from './utils';

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

  const [selected, setSelected] = useState<string[]>(
    participants.slice(0, MAX_STREAMS).map((p) => p.id),
  );

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
          </div>
          <p className="text-sm text-slate-400 font-medium truncate pl-7">{title}</p>
          <p className="text-xs text-slate-600 font-medium pl-7">
            시청할 스트리머를 선택하세요 · 최대 {MAX_STREAMS}명
          </p>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {participants.map((s) => {
            const color = getStreamerColor(s.id, isDark) ?? s.colorCode;
            const isSelected = selected.includes(s.id);
            const isDisabled = !isSelected && selected.length >= MAX_STREAMS;

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
                  className="relative w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-base shrink-0 transition-all duration-200"
                  style={{
                    backgroundColor: color,
                    boxShadow: isSelected ? `0 0 0 2px #0f172a, 0 0 0 4px ${color}` : 'none',
                  }}
                >
                  {s.profileImg ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.profileImg} alt={s.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    s.name[0]
                  )}
                  {isSelected && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span className={`text-[11px] font-bold text-center line-clamp-1 w-full transition-colors ${
                  isSelected ? 'text-white' : 'text-slate-500'
                }`}>
                  {s.name}
                </span>
              </button>
            );
          })}
        </div>

        <a
          href="https://chromewebstore.google.com/detail/jmehpmfkiciefbgoebiljadeamohkgfb"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 transition-colors group"
        >
          <Puzzle className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-black text-amber-400 leading-none mb-0.5">채팅 확장 프로그램 설치</p>
            <p className="text-[10px] text-amber-300/60 font-medium">채팅 기능을 사용하려면 Chrome 확장 프로그램이 필요합니다</p>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-amber-500 group-hover:text-amber-300 shrink-0 transition-colors" />
        </a>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-500">
              <span className="text-white font-black">{selected.length}</span>명 선택
            </span>
            {selected.length >= MAX_STREAMS && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                최대
              </span>
            )}
            <button
              onClick={selected.length > 0 ? clearAll : selectAll}
              className="text-[11px] font-black text-slate-600 hover:text-slate-400 transition-colors"
            >
              {selected.length > 0 ? '전체 해제' : '전체 선택'}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-2xl border border-slate-700 text-slate-400 text-sm font-black hover:bg-slate-800 transition-colors"
            >
              취소
            </button>
            <button
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
