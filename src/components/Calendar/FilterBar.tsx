'use client';

import { useState, type ReactNode } from 'react';
import { Button, Popover, SearchField, Tabs } from '@heroui/react';
import { SlidersHorizontal, X, Check, Star } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTheme } from '@teispace/next-themes';
import type { Streamer, Game } from '@prisma/client';
import StreamerAvatar from '@/components/streamer/StreamerAvatar';
import { getStreamerImagePath } from '@/lib/utils';
import { getStreamerColor } from '@/constants/streamercolor';
import { getGameColor } from '@/constants/gamecolor';
import { useChosungSearch } from '@/hooks/useChosungSearch';
import FavoritesOnlyToggle from '@/components/Common/FavoritesOnlyToggle';

type Tab = 'streamer' | 'game';

interface FilterPanelProps {
  streamers: Streamer[];
  games: Game[];
  selectedStreamers: Set<string>;
  selectedGames: Set<string>;
  favoriteIds: Set<string>;
  onStreamerToggle: (id: string) => void;
  onGameToggle: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onApplyFavorites: () => void;
  isDark: boolean;
  onClose?: () => void;
}

function FilterPanel({
  streamers,
  games,
  selectedStreamers,
  selectedGames,
  favoriteIds,
  onStreamerToggle,
  onGameToggle,
  onToggleFavorite,
  onApplyFavorites,
  isDark,
  onClose,
}: FilterPanelProps) {
  const favoriteCount = favoriteIds.size;
  const [tab, setTab] = useState<Tab>('streamer');
  const {
    search,
    setSearch,
    filtered: filteredStreamers,
  } = useChosungSearch(streamers);

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1 border-b border-slate-100 px-2 py-2 dark:border-slate-800">
        <Tabs
          className="min-w-0 flex-1"
          selectedKey={tab}
          onSelectionChange={(key) => {
            setTab(key as Tab);
            setSearch('');
          }}
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="필터 종류">
              <Tabs.Tab id="streamer">
                스트리머
                {selectedStreamers.size > 0 && (
                  <span className="ml-1 rounded-full bg-indigo-500 px-1 py-px text-[9px] font-black text-white">
                    {selectedStreamers.size}
                  </span>
                )}
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="game">
                게임
                {selectedGames.size > 0 && (
                  <span className="ml-1 rounded-full bg-indigo-500 px-1 py-px text-[9px] font-black text-white">
                    {selectedGames.size}
                  </span>
                )}
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
        {onClose && (
          <Button isIconOnly size="sm" variant="ghost" aria-label="필터 닫기" onPress={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {tab === 'streamer' && (
        <div className="px-3 pb-1 pt-2.5">
          <SearchField aria-label="스트리머 검색" value={search} onChange={setSearch}>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="이름 또는 초성 검색..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </div>
      )}

      {/* 탭 컨텐츠 */}
      <div className="p-3 overflow-y-auto max-h-56 custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.13, ease: 'easeInOut' }}
            className="flex w-full flex-col gap-2"
            style={{ display: 'flex' }}
          >
            {tab === 'streamer' && (
              <>
                {favoriteCount > 0 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mb-2 w-full"
                    onPress={() => {
                      onApplyFavorites();
                      onClose?.();
                    }}
                  >
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    내 멤버 ({favoriteCount})
                  </Button>
                )}
                {filteredStreamers.length === 0 ? (
                  <p className="text-xs font-bold text-slate-300 dark:text-slate-600 text-center py-4">
                    결과 없음
                  </p>
                ) : (
                <div className="grid grid-cols-4 gap-1">
                  <AnimatePresence mode="popLayout">
                    {filteredStreamers.map((streamer, i) => {
                      const isSelected = selectedStreamers.has(streamer.id);
                      const isFav = favoriteIds.has(streamer.id);
                      return (
                        <div key={streamer.id} className="relative">
                        <motion.button
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
                          className={`w-full flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors ${
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
                        <button
                          type="button"
                          title={isFav ? '즐겨찾기 해제' : '즐겨찾기'}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(streamer.id);
                          }}
                          className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-white/90 dark:bg-slate-900/90 shadow-sm"
                        >
                          <Star
                            className={`w-3 h-3 ${
                              isFav
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        </button>
                        </div>
                      );
                    })}
                  </AnimatePresence>
                </div>
                )}
              </>
            )}

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
  favoriteIds: Set<string>;
  onStreamerToggle: (id: string) => void;
  onGameToggle: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onApplyFavorites: () => void;
  onClearAll: () => void;
  leading?: ReactNode;
}

export default function FilterBar({
  streamers,
  games,
  selectedStreamers,
  selectedGames,
  favoriteIds,
  onStreamerToggle,
  onGameToggle,
  onToggleFavorite,
  onApplyFavorites,
  onClearAll,
  leading,
}: FilterBarProps) {
  const favoriteCount = favoriteIds.size;
  const [isOpen, setIsOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const hasFilters = selectedStreamers.size > 0 || selectedGames.size > 0;
  const totalFilters = selectedStreamers.size + selectedGames.size;

  return (
    <div className="mb-3 flex flex-col gap-2">
      <div className="flex flex-nowrap items-center gap-2 overflow-x-auto [&>*]:shrink-0">
      {leading}
      <FavoritesOnlyToggle appearance="hero" />
      {favoriteCount > 0 && (
        <Button size="sm" variant="secondary" onPress={onApplyFavorites}>
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          필터에 적용
        </Button>
      )}
      <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
        <Button size="sm" variant={isOpen || hasFilters ? 'primary' : 'secondary'}>
          <SlidersHorizontal className="h-3.5 w-3.5" />
          필터
          {totalFilters > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/25 text-[10px] font-black leading-none">
              {totalFilters}
            </span>
          )}
        </Button>
        <Popover.Content placement="bottom start" className="w-72 max-w-[calc(100vw-1.5rem)]">
          <Popover.Dialog className="max-h-[70dvh] overflow-hidden p-0 outline-none">
            <FilterPanel
              streamers={streamers}
              games={games}
              selectedStreamers={selectedStreamers}
              selectedGames={selectedGames}
              favoriteIds={favoriteIds}
              onStreamerToggle={onStreamerToggle}
              onGameToggle={onGameToggle}
              onToggleFavorite={onToggleFavorite}
              onApplyFavorites={onApplyFavorites}
              isDark={isDark}
              onClose={() => setIsOpen(false)}
            />
          </Popover.Dialog>
        </Popover.Content>
      </Popover>
      </div>

      {hasFilters ? (
      <motion.div
        className="flex flex-wrap items-center gap-1.5"
        style={{ display: 'flex' }}
      >
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
                display: 'inline-flex',
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
                display: 'inline-flex',
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
          <Button key="clear" size="sm" variant="ghost" onPress={onClearAll}>
            전체 해제
          </Button>
        )}
      </AnimatePresence>
      </motion.div>
      ) : null}
    </div>
  );
}
