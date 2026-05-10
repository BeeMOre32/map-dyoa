'use client';

import { useState } from 'react';
import { X, LayoutGrid, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { drawerBackdropVariants, drawerPanelVariants } from '@/lib/modalVariants';
import type { Streamer } from '@prisma/client';
import StreamerAvatar from '@/components/streamer/StreamerAvatar';
import { getStreamerImagePath } from '@/lib/utils';
import StreamerSearchInput from '@/components/Calendar/StreamerSearchInput';

interface SettingsPanelProps {
  streamers: Streamer[];
  selectedStreamers: Set<string>;
  onStreamerToggle: (id: string) => void;
  onClearFilters: () => void;
  onClose: () => void;
}

export default function SettingsPanel({
  streamers,
  selectedStreamers,
  onStreamerToggle,
  onClearFilters,
  onClose,
}: SettingsPanelProps) {
  const [filtered, setFiltered] = useState<Streamer[]>(streamers);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const hasFilters = selectedStreamers.size > 0;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* 드로어 패널 */}
      <motion.div
        variants={drawerPanelVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="relative w-full sm:w-80 h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-r border-slate-100 dark:border-slate-800 z-10"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <p className="text-xs sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Calendar
            </p>
            <h2 className="text-xl sm:text-lg font-black text-slate-800 dark:text-white leading-tight mt-0.5">
              설정
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">

          {/* 스트리머 필터 */}
          <section className="border-b border-slate-100 dark:border-slate-800">
            {/* 섹션 헤더 (클릭으로 토글) */}
            <button
              onClick={() => setIsFilterOpen((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span className="text-xs sm:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  스트리머 필터
                </span>
                {hasFilters && (
                  <span className="text-xs sm:text-[10px] font-black text-white bg-indigo-500 rounded-full px-1.5 py-0.5 leading-none">
                    {selectedStreamers.size}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hasFilters && (
                  <span
                    onClick={(e) => { e.stopPropagation(); onClearFilters(); }}
                    className="text-xs sm:text-[11px] font-black text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                  >
                    초기화
                  </span>
                )}
                <motion.div
                  animate={{ rotate: isFilterOpen ? 180 : 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                >
                  <ChevronDown className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                </motion.div>
              </div>
            </button>

            {/* 콘텐츠 (접힘/펼침) */}
            <AnimatePresence initial={false}>
              {isFilterOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4 space-y-3">
                    {/* 검색 */}
                    <StreamerSearchInput streamers={streamers} onFilter={setFiltered} />

                    {/* 스트리머 그리드 */}
                    {filtered.length === 0 ? (
                      <p className="text-xs font-bold text-slate-300 dark:text-slate-600 text-center py-4">
                        결과 없음
                      </p>
                    ) : (
                      <div className="grid grid-cols-4 gap-1">
                        {filtered.map((streamer) => {
                          const isSelected = selectedStreamers.has(streamer.id);
                          return (
                            <motion.button
                              key={streamer.id}
                              onClick={() => onStreamerToggle(streamer.id)}
                              whileTap={{ scale: 0.93 }}
                              className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                                isSelected
                                  ? 'bg-indigo-50 dark:bg-indigo-900/20'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                              }`}
                            >
                              <div className={`rounded-2xl transition-all ${isSelected ? 'ring-2 ring-indigo-400 dark:ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900' : ''}`}>
                                <StreamerAvatar
                                  name={streamer.name}
                                  imgSrc={streamer.profileImg ?? getStreamerImagePath(streamer.name)}
                                  colorCode={streamer.colorCode}
                                  streamerId={streamer.id}
                                  size="small"
                                />
                              </div>
                              <span className={`text-xs sm:text-[10px] font-black w-full text-center truncate leading-none transition-colors ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                {streamer.name}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* UI 설정 */}
          <section className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <LayoutGrid className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span className="text-xs sm:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                UI 설정
              </span>
            </div>
            <p className="text-xs font-bold text-slate-300 dark:text-slate-600 px-1">
              준비 중이에요.
            </p>
          </section>

        </div>

        {/* 하단 필터 상태 */}
        {hasFilters && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0"
          >
            <p className="text-xs font-black text-indigo-500 dark:text-indigo-400 text-center">
              {selectedStreamers.size}명 필터 적용 중
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* 백드롭 (sm 이상에서만) */}
      <motion.div
        variants={drawerBackdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="hidden sm:block flex-1 bg-black/25 backdrop-blur-[2px]"
        onClick={onClose}
      />
    </div>
  );
}
