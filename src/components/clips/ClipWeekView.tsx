'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { extractChzzkClipId } from '@/lib/chzzk';
import { subscribeClipRecommend } from '@/lib/clip-recommend-client';
import type { ClipWeekRecommendRow } from '@/lib/clip-week';
import { ClipPlayerModal } from './ClipPlayerModal';

function daysAgo(iso: string | null): string | null {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return null;
  const days = Math.floor((Date.now() - time) / 86_400_000);
  if (days <= 0) return '오늘';
  if (days === 1) return '어제';
  return `${days}일 전`;
}

export default function ClipWeekView({ rows: initialRows }: { rows: ClipWeekRecommendRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [playing, setPlaying] = useState<ClipWeekRecommendRow | null>(null);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  useEffect(() => {
    const stops = initialRows.map((row) =>
      subscribeClipRecommend(row.clipId, (detail) => {
        setRows((current) =>
          current.map((item) =>
            item.clipId === detail.clipId ? { ...item, recommends: detail.recommends } : item,
          ),
        );
        setPlaying((current) =>
          current && current.clipId === detail.clipId
            ? { ...current, recommends: detail.recommends }
            : current,
        );
      }),
    );
    return () => {
      for (const stop of stops) stop();
    };
  }, [initialRows]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-slate-50 px-3 py-3 dark:border-slate-800 sm:px-4">
        <h1 className="text-base font-black text-slate-800 dark:text-white sm:text-lg">주간 추천</h1>
        <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          이번 주 추천이 많은 클립입니다. 추천 수는 월요일이 되어도 그대로 남습니다.
        </p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-sm font-bold text-slate-400 dark:text-slate-500 sm:px-5">
            이번 주는 아직 추천이 없습니다. 클립을 열고 추천해 보세요.
          </p>
        ) : (
          <ol>
            {rows.map((row, index) => {
              const when = daysAgo(row.clipDate);
              return (
                <motion.li
                  key={row.clipId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: 'spring',
                    bounce: 0.18,
                    visualDuration: 0.4,
                    delay: Math.min(index, 8) * 0.035,
                  }}
                  className="border-b border-slate-100 last:border-b-0 dark:border-slate-800"
                >
                  <button
                    type="button"
                    onClick={() => setPlaying(row)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 sm:px-4"
                  >
                    <span className="w-5 shrink-0 text-sm tabular-nums text-slate-400">{index + 1}</span>
                    <span className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                      {row.thumbnailUrl ? (
                        <img src={row.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-sm leading-snug text-slate-800 dark:text-slate-100">
                        {row.title}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-1 sm:hidden">
                        {row.streamers.map((name) => (
                          <span
                            key={name}
                            className="rounded-full border border-slate-200 px-1.5 py-px text-[10px] text-slate-600 dark:border-slate-700 dark:text-slate-300"
                          >
                            {name}
                          </span>
                        ))}
                        {when ? <span className="text-[10px] text-slate-400">{when}</span> : null}
                      </span>
                    </span>
                    <span className="hidden max-w-40 flex-wrap justify-end gap-1 sm:flex">
                      {row.streamers.map((name) => (
                        <span
                          key={name}
                          className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600 dark:border-slate-700 dark:text-slate-300"
                        >
                          {name}
                        </span>
                      ))}
                    </span>
                    <span className="hidden w-14 shrink-0 text-right text-xs text-slate-400 sm:block">{when}</span>
                    <span className="w-14 shrink-0 text-right">
                      <span className="block text-sm font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                        {row.recommends}
                      </span>
                      <span className="block text-[10px] font-medium text-slate-400">
                        이번 주 {row.weekRecommends}
                      </span>
                    </span>
                  </button>
                </motion.li>
              );
            })}
          </ol>
        )}
      </div>
      <AnimatePresence>
        {playing ? (
          <ClipPlayerModal
            url={playing.url}
            embedId={extractChzzkClipId(playing.url)}
            clipId={playing.clipId}
            title={playing.title}
            recommends={playing.recommends}
            onClose={() => setPlaying(null)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
