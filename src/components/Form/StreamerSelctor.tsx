'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Streamer } from '@prisma/client';
import StreamerAvatar from '@/components/streamer/StreamerAvatar';
import { getStreamerImagePath, getChosung } from '@/lib/utils';
import { getStreamerColor } from '@/constants/streamercolor';

interface StreamerSelectorProps {
  streamers: Streamer[];
  selectedStreamers: string[];
  guestStreamers?: string[];
  toggleStreamer: (id: string) => void;
  toggleGuest?: (id: string) => void;
  compact?: boolean;
}

export default function StreamerSelector({
  streamers,
  selectedStreamers,
  guestStreamers = [],
  toggleStreamer,
  toggleGuest,
  compact = false,
}: StreamerSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { resolvedTheme } = useTheme();

  const filteredStreamers = useMemo(() => {
    const term = searchTerm.trim();
    return [...streamers]
      .filter((s) => {
        if (!term) return true;
        const name = s.name.toLowerCase();
        const lower = term.toLowerCase();
        return name.includes(lower) || getChosung(s.name).includes(term);
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, [streamers, searchTerm]);

  return (
    <div className="w-full space-y-3">
      <div className="relative group">
        <input
          type="text"
          placeholder="스트리머 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-600 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm ${
            compact ? 'pl-3 pr-3 py-2' : 'pl-12 pr-10 py-4 px-4'
          }`}
        />
      </div>

      {/* 스트리머 그리드 */}
      <div className={`bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden ${compact ? 'rounded-2xl px-3 pt-3 pb-4' : 'rounded-[2.5rem] px-6 pt-6 pb-8'}`}>
        <div
          className={`grid overflow-y-auto custom-scrollbar ${
            compact
              ? 'grid-cols-4 gap-2 max-h-40 py-1'
              : 'grid-cols-3 gap-4 max-h-120 py-2'
          }`}
          style={{ alignItems: 'start' }}
        >
          <AnimatePresence mode="popLayout">
            {filteredStreamers.map((streamer) => {
              const isSelected = selectedStreamers.includes(streamer.id);
              const isGuest = guestStreamers.includes(streamer.id);
              const streamerColor = getStreamerColor(streamer.id, resolvedTheme === 'dark') ?? streamer.colorCode;

              return (
                <motion.div
                  layout
                  key={streamer.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  style={{ display: 'flex', flexDirection: 'column' }}
                  className={compact ? 'flex flex-col items-center' : 'flex flex-col items-center justify-start min-h-27.5'}
                >
                  <div className={`flex flex-col items-center w-full ${compact ? 'gap-1.5' : 'gap-2.5'}`}>
                    <button
                      type="button"
                      onClick={() => toggleStreamer(streamer.id)}
                      className={`flex flex-col items-center w-full group outline-none ${compact ? 'gap-1.5' : 'gap-4'}`}
                    >
                      <div
                        className={`relative shrink-0 rounded-2xl transition-all duration-300 ${
                          isSelected
                            ? 'scale-110 shadow-xl'
                            : 'opacity-50 grayscale group-hover:opacity-100 group-hover:grayscale-0 group-hover:scale-105'
                        }`}
                        style={
                          isSelected
                            ? { outline: `2.5px solid ${streamerColor}`, outlineOffset: '3px' }
                            : undefined
                        }
                      >
                        <StreamerAvatar
                          name={streamer.name}
                          imgSrc={streamer.profileImg ?? getStreamerImagePath(streamer.name)}
                          colorCode={streamerColor}
                          streamerId={streamer.id}
                          size={compact ? 'small' : 'medium'}
                        />
                      </div>

                      <span
                        className={`font-black text-center truncate w-full leading-tight transition-colors ${
                          compact ? 'text-[11px] px-0.5' : 'text-[13px] px-1'
                        } ${
                          isSelected
                            ? 'text-slate-900 dark:text-slate-100'
                            : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                        }`}
                        style={{ color: isSelected ? streamerColor : undefined }}
                      >
                        {streamer.name}
                      </span>
                    </button>

                    {isSelected && toggleGuest && (
                      <button
                        type="button"
                        onClick={() => toggleGuest(streamer.id)}
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-black transition-colors ${
                          isGuest
                            ? 'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
                            : 'border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500 dark:hover:text-slate-300'
                        }`}
                      >
                        {isGuest ? '게스트' : '멤버'}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
