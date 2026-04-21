'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Streamer } from '@prisma/client';
import StreamerAvatar from '@/components/streamer/StreamerAvatar';
import { getStreamerImagePath } from '@/lib/utils';

interface StreamerSelectorProps {
  streamers: Streamer[];
  selectedStreamers: string[];
  toggleStreamer: (id: string) => void;
}

export default function StreamerSelector({
  streamers,
  selectedStreamers,
  toggleStreamer,
}: StreamerSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStreamers = useMemo(() => {
    return [...streamers]
      .filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, [streamers, searchTerm]);

  return (
    <div className="w-full space-y-6">
      <div className="relative group px-1 mb-4">
        <input
          type="text"
          placeholder="스트리머 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-10 py-4 px-4 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-600 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
        />
      </div>

      {/* 📋 스트리머 그리드 영역 */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 pt-6 pb-8 px-6 shadow-sm overflow-hidden">
        <div
          className="grid grid-cols-3 gap-4 max-h-120 overflow-y-auto pr-2 custom-scrollbar py-2"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            alignItems: 'start',
          }}
        >
          <AnimatePresence mode="popLayout">
            {filteredStreamers.map((streamer) => {
              const isSelected = selectedStreamers.includes(streamer.id);

              return (
                <motion.div
                  layout
                  key={streamer.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center justify-start min-h-27.5"
                >
                  <button
                    type="button"
                    onClick={() => toggleStreamer(streamer.id)}
                    className="flex flex-col items-center gap-4 w-full group outline-none"
                  >
                    <div
                      className={`relative shrink-0 rounded-2xl transition-all duration-300 ${
                        isSelected
                          ? 'scale-110 shadow-xl'
                          : 'opacity-50 grayscale group-hover:opacity-100 group-hover:grayscale-0 group-hover:scale-105'
                      }`}
                      style={
                        isSelected
                          ? {
                              outline: `2.5px solid ${streamer.colorCode}`,
                              outlineOffset: '3px',
                            }
                          : undefined
                      }
                    >
                      <StreamerAvatar
                        name={streamer.name}
                        imgSrc={getStreamerImagePath(streamer.name)}
                        colorCode={streamer.colorCode}
                        size="medium"
                      />
                    </div>

                    {/* 닉네임 */}
                    <span
                      className={`text-[13px] font-black text-center truncate w-full px-1 leading-tight transition-colors ${
                        isSelected
                          ? 'text-slate-900 dark:text-slate-100'
                          : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                      }`}
                      style={{
                        color: isSelected ? streamer.colorCode : undefined,
                      }}
                    >
                      {streamer.name}
                    </span>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
