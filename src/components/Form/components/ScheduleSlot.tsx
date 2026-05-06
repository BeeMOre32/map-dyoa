'use client';

import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Trash2, X, Link as LinkIcon, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StreamerSelector from '../StreamerSelctor';
import { SlotEntry, Game, Streamer, SlotErrors } from '../types';

type ScheduleSlotProps = {
  slot: SlotEntry;
  index: number;
  isExpanded: boolean;
  sortedStreamers: Streamer[];
  games: Game[];
  onToggleExpand: () => void;
  onRemove: () => void;
  onUpdate: (updates: Partial<SlotEntry>) => void;
  onLiveUrlBlur: (url: string) => Promise<void>;
};

export default function ScheduleSlot({
  slot,
  index,
  isExpanded,
  sortedStreamers,
  games,
  onToggleExpand,
  onRemove,
  onUpdate,
  onLiveUrlBlur,
}: ScheduleSlotProps) {
  const hasErrors = Object.keys(slot.errors).length > 0;

  const handleToggleStreamer = (id: string) => {
    const has = slot.selectedStreamerIds.includes(id);
    onUpdate({
      selectedStreamerIds: has
        ? slot.selectedStreamerIds.filter((x) => x !== id)
        : [...slot.selectedStreamerIds, id],
      errors: {
        ...slot.errors,
        streamerIds: undefined,
      },
    });
  };

  const formatPreview = (): string => {
    const parts: string[] = [];
    if (slot.startTime) {
      try {
        const d = new Date(
          slot.startTime.includes('T')
            ? slot.startTime
            : slot.startTime + 'T00:00',
        );
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        parts.push(slot.isTimeTBD ? `${month}/${day}` : `${month}/${day} ${hours}:${minutes}`);
      } catch {
        /* ignore */
      }
    }
    if (slot.selectedStreamerIds.length > 0)
      parts.push(`${slot.selectedStreamerIds.length}명`);
    return parts.join(' · ');
  };

  const preview = formatPreview();

  return (
    <div
      className={`rounded-2xl border transition-all ${
        hasErrors
          ? 'border-red-300 dark:border-red-700'
          : isExpanded
            ? 'border-indigo-200 dark:border-indigo-700 shadow-md shadow-indigo-50 dark:shadow-indigo-950/30'
            : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        )}
        <span
          className={`text-sm font-black shrink-0 ${isExpanded ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'}`}
        >
          일정 {index + 1}
        </span>
        {!isExpanded && (
          <span className="text-sm text-slate-500 dark:text-slate-400 truncate flex-1 font-medium">
            {slot.title ? (
              <>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {slot.title}
                </span>
                {preview && (
                  <span className="ml-2 text-slate-400 dark:text-slate-500 text-xs">
                    {preview}
                  </span>
                )}
              </>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 italic">
                미입력
              </span>
            )}
          </span>
        )}
        {isExpanded && <span className="flex-1" />}
        {hasErrors && !isExpanded && (
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
        )}
      </button>
      {slot.liveUrls.length > 0 && (
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onRemove();
          }}
          className="absolute top-2 right-2 p-1 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0 cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </div>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 pt-1 space-y-4 border-t border-slate-100 dark:border-slate-700">
              <div className="pt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                    방송 링크
                    <span className="ml-1.5 normal-case font-medium text-indigo-400 dark:text-indigo-500">
                      · 치지직 URL 자동 채우기
                    </span>
                  </label>
                  {slot.metaLoading && (
                    <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />
                  )}
                  {!slot.metaLoading && slot.autoFilled.length > 0 && (
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                  )}
                </div>
                <div className="space-y-1.5">
                  {slot.liveUrls.map((url, urlIdx) => (
                    <div key={urlIdx} className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={url}
                        onChange={(e) =>
                          onUpdate({
                            liveUrls: slot.liveUrls.map((u, i) =>
                              i === urlIdx ? e.target.value : u,
                            ),
                            autoFilled: [],
                          })
                        }
                        onBlur={() => onLiveUrlBlur(url)}
                        placeholder="https://chzzk.naver.com/live/..."
                        className="w-full pl-8 pr-8 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                      />
                      {slot.liveUrls.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdate({
                              liveUrls: slot.liveUrls.filter(
                                (_, i) => i !== urlIdx,
                              ),
                            })
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-300 dark:text-slate-600 hover:text-red-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdate({
                      liveUrls: [...slot.liveUrls, ''],
                    })
                  }
                  className="mt-1.5 flex items-center gap-1 text-xs font-bold text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  URL 추가
                </button>
                <AnimatePresence>
                  {slot.autoFilled.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800"
                    >
                      <CheckCircle2 className="w-3 h-3 text-indigo-500 shrink-0" />
                      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        자동 입력: {slot.autoFilled.join(' · ')}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdate({
                            autoFilled: [],
                          })
                        }
                        className="ml-auto text-indigo-300 hover:text-indigo-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  방송 제목
                </label>
                <input
                  type="text"
                  value={slot.title}
                  onChange={(e) =>
                    onUpdate({
                      title: e.target.value,
                      errors: {
                        ...slot.errors,
                        title: undefined,
                      },
                    })
                  }
                  placeholder="예) 문명 6 합방"
                  className={`w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-base font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all ${slot.errors.title ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
                />
                {slot.errors.title && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-bold text-red-500">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {slot.errors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  플레이 게임 (선택)
                </label>
                <select
                  value={slot.selectedGameId}
                  onChange={(e) =>
                    onUpdate({
                      selectedGameId: e.target.value,
                    })
                  }
                  className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/50 outline-none text-slate-700 dark:text-slate-200 transition-all"
                >
                  <option value="">선택 안 함</option>
                  {games.map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                    시작 시간
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={slot.isTimeTBD}
                      onChange={(e) =>
                        onUpdate({
                          isTimeTBD: e.target.checked,
                        })
                      }
                      className="w-3.5 h-3.5 rounded accent-indigo-600"
                    />
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                      시간 미정
                    </span>
                  </label>
                </div>
                <input
                  type={slot.isTimeTBD ? 'date' : 'datetime-local'}
                  value={
                    slot.isTimeTBD
                      ? slot.startTime.split('T')[0]
                      : slot.startTime
                  }
                  onChange={(e) =>
                    onUpdate({
                      startTime: e.target.value,
                      errors: {
                        ...slot.errors,
                        startTime: undefined,
                      },
                    })
                  }
                  className={`w-full p-3 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all scheme-light dark:scheme-dark ${slot.errors.startTime ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
                />
                {slot.errors.startTime && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-bold text-red-500">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {slot.errors.startTime}
                  </p>
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-3">
                <label className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                  참여 멤버{' '}
                  <span className="text-indigo-500">
                    ({slot.selectedStreamerIds.length})
                  </span>
                </label>
                {slot.errors.streamerIds && (
                  <p className="flex items-center gap-1 text-xs font-bold text-red-500">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {slot.errors.streamerIds}
                  </p>
                )}
                <StreamerSelector
                  compact
                  streamers={sortedStreamers}
                  selectedStreamers={slot.selectedStreamerIds}
                  toggleStreamer={handleToggleStreamer}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
