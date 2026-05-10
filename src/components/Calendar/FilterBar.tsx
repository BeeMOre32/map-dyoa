'use client';

import { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, X, ChevronDown, Search, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import type { Streamer, Game } from '@prisma/client';
import StreamerAvatar from '@/components/streamer/StreamerAvatar';
import { getStreamerImagePath } from '@/lib/utils';
import { getStreamerColor } from '@/constants/streamercolor';
import { getGameColor } from '@/constants/gamecolor';
import { useChosungSearch } from '@/hooks/useChosungSearch';

type Tab = 'streamer' | 'game';

interface FilterPanelProps {
  streamers: Streamer[];
  games: Game[];
  selectedStreamers: Set<string>;
  selectedGames: Set<string>;
  onStreamerToggle: (id: string) => void;
  onGameToggle: (id: string) => void;
  isDark: boolean;
  onClose?: () => void;
}

function FilterPanel({
  streamers,
  games,
  selectedStreamers,
  selectedGames,
  onStreamerToggle,
  onGameToggle,
  isDark,
  onClose,
}: FilterPanelProps) {
  const [tab, setTab] = useState<Tab>('streamer');
  const {
    search,
    setSearch,
    filtered: filteredStreamers,
  } = useChosungSearch(streamers);

  return (
    <div className="flex flex-col">
      {/* 탭 헤더 */}
      <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-2 pt-2">
        {(['streamer', 'game'] as Tab[]).map((t) => {
          const label = t === 'streamer' ? '스트리머' : '게임';
          const count =
            t === 'streamer' ? selectedStreamers.size : selectedGames.size;
          const isActive = tab === t;
          return (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setSearch('');
              }}
              className={`relative px-3 py-2 text-xs font-black transition-colors ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {label}
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    className="ml-1 text-[9px] font-black bg-indigo-500 text-white rounded-full px-1 py-px"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive && (
                <motion.div
                  layoutId="filter-tab-bar"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full"
                />
              )}
            </button>
          );
        })}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto mr-1 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 dark:text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 검색 (스트리머 탭) */}
      <AnimatePresence initial={false}>
        {tab === 'streamer' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-3 pt-2.5 pb-1">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-700">
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
                      <X className="w-3 h-3" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 탭 컨텐츠 */}
      <div className="p-3 overflow-y-auto max-h-56 custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.13, ease: 'easeInOut' }}
          >
            {tab === 'streamer' &&
              (filteredStreamers.length === 0 ? (
                <p className="text-xs font-bold text-slate-300 dark:text-slate-600 text-center py-4">
                  결과 없음
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-1">
                  <AnimatePresence mode="popLayout">
                    {filteredStreamers.map((streamer, i) => {
                      const isSelected = selectedStreamers.has(streamer.id);
                      return (
                        <motion.button
                          key={streamer.id}
                          layout
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            transition: { delay: i * 0.025, duration: 0.15 },
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.85,
                            transition: { duration: 0.1 },
                          }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onStreamerToggle(streamer.id)}
                          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-900/20'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div
                            className={`rounded-2xl transition-all ${
                              isSelected
                                ? 'ring-2 ring-indigo-400 dark:ring-indigo-500 ring-offset-1 ring-offset-white dark:ring-offset-slate-900'
                                : ''
                            }`}
                          >
                            <StreamerAvatar
                              name={streamer.name}
                              imgSrc={streamer.profileImg ?? getStreamerImagePath(streamer.name)}
                              colorCode={streamer.colorCode}
                              streamerId={streamer.id}
                              size="small"
                            />
                          </div>
                          <span
                            className={`text-[10px] font-black w-full text-center truncate leading-none transition-colors ${
                              isSelected
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            {streamer.name}
                          </span>
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ))}

            {tab === 'game' && (
              <div className="space-y-0.5">
                {games.map((game) => {
                  const isSelected = selectedGames.has(game.id);
                  const color = getGameColor(game.id, isDark);
                  return (
                    <motion.button
                      key={game.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onGameToggle(game.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: color ?? '#94a3b8' }}
                      />
                      {game.title}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{
                              type: 'spring',
                              damping: 20,
                              stiffness: 400,
                            }}
                            className="ml-auto"
                          >
                            <Check className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

interface FilterBarProps {
  streamers: Streamer[];
  games: Game[];
  selectedStreamers: Set<string>;
  selectedGames: Set<string>;
  onStreamerToggle: (id: string) => void;
  onGameToggle: (id: string) => void;
  onClearAll: () => void;
}

export default function FilterBar({
  streamers,
  games,
  selectedStreamers,
  selectedGames,
  onStreamerToggle,
  onGameToggle,
  onClearAll,
}: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const hasFilters = selectedStreamers.size > 0 || selectedGames.size > 0;
  const totalFilters = selectedStreamers.size + selectedGames.size;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="flex items-center gap-2 flex-wrap shrink-0 mb-3">
      {/* 필터 버튼 + 데스크탑 팝오버 */}
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-bold transition-all shadow-sm ${
            isOpen || hasFilters
              ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          필터
          <AnimatePresence>
            {totalFilters > 0 && (
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: 'spring', damping: 20, stiffness: 400 }}
                className="bg-indigo-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center leading-none"
              >
                {totalFilters}
              </motion.span>
            )}
          </AnimatePresence>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-3 h-3" />
          </motion.div>
        </button>

        {/* 데스크탑 팝오버 */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={popoverRef}
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ type: 'spring', damping: 28, stiffness: 420 }}
              className="absolute top-full mt-2 left-0 z-50 hidden sm:block w-72 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/60 overflow-hidden"
            >
              <FilterPanel
                streamers={streamers}
                games={games}
                selectedStreamers={selectedStreamers}
                selectedGames={selectedGames}
                onStreamerToggle={onStreamerToggle}
                onGameToggle={onGameToggle}
                isDark={isDark}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 활성 칩들 + 전체 해제 */}
      <AnimatePresence mode="popLayout">
        {[...selectedStreamers].map((id) => {
          const streamer = streamers.find((s) => s.id === id);
          if (!streamer) return null;
          const color = getStreamerColor(id, isDark) ?? streamer.colorCode;
          return (
            <motion.span
              key={`s-${id}`}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', damping: 22, stiffness: 380 }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border"
              style={{
                color,
                borderColor: `${color}40`,
                backgroundColor: `${color}12`,
              }}
            >
              {streamer.name}
              <button
                onClick={() => onStreamerToggle(id)}
                className="hover:opacity-60 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.span>
          );
        })}

        {[...selectedGames].map((id) => {
          const game = games.find((g) => g.id === id);
          if (!game) return null;
          const color = getGameColor(id, isDark) ?? '#6366f1';
          return (
            <motion.span
              key={`g-${id}`}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', damping: 22, stiffness: 380 }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border"
              style={{
                color,
                borderColor: `${color}40`,
                backgroundColor: `${color}12`,
              }}
            >
              {game.title}
              <button
                onClick={() => onGameToggle(id)}
                className="hover:opacity-60 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.span>
          );
        })}

        {hasFilters && (
          <motion.button
            key="clear"
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClearAll}
            className="text-xs font-bold text-slate-300 dark:text-slate-600 hover:text-red-400 dark:hover:text-red-400 transition-colors"
          >
            전체 해제
          </motion.button>
        )}
      </AnimatePresence>

      {/* 모바일 바텀시트 */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="sm:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className="sm:hidden fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-100 dark:border-slate-800"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
              </div>
              <FilterPanel
                streamers={streamers}
                games={games}
                selectedStreamers={selectedStreamers}
                selectedGames={selectedGames}
                onStreamerToggle={onStreamerToggle}
                onGameToggle={onGameToggle}
                isDark={isDark}
                onClose={() => setIsOpen(false)}
              />
              <div className="h-6" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
