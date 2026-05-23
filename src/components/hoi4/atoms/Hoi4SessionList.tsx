'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, ChevronDown, Sword } from 'lucide-react';
import { useTheme } from 'next-themes';
import { getStreamerColor } from '@/constants/streamercolor';
import type { Hoi4LeaderboardData } from '@/lib/data-fetching';
import {
  formatHoi4SessionDate,
  hoi4ResultBadgeClass,
} from '@/lib/hoi4/hoi4ViewUtils';
import { markModalSoftNav } from '@/lib/modal-navigation';
import {
  statsInteractiveHover,
  statsListVariants,
  statsRowVariants,
  statsSectionVariants,
} from '@/lib/statsMotion';

interface Hoi4SessionListProps {
  sessions: Hoi4LeaderboardData['sessions'];
  canLoadMore: boolean;
  onLoadMore: () => void;
}

export default function Hoi4SessionList({
  sessions,
  canLoadMore,
  onLoadMore,
}: Hoi4SessionListProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <motion.section
      custom={1}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={statsSectionVariants}
      className="space-y-3"
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <Sword className="h-4 w-4 text-amber-500" />
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
            최근 세션
          </p>
        </div>
        <span className="text-[10px] font-bold tabular-nums text-slate-400 dark:text-slate-500">
          {sessions.length}개
        </span>
      </div>

      <motion.div
        variants={statsListVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        <AnimatePresence initial={false}>
          {sessions.map((session, index) => (
            <motion.div
              key={session.id}
              custom={index}
              variants={statsRowVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -8 }}
              layout
              className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
            >
              <Link
                href={`/calendar/schedule/${session.id}`}
                scroll={false}
                onClick={markModalSoftNav}
                className="group flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 transition-colors hover:bg-white dark:border-slate-800 dark:hover:bg-slate-800/60"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Sword className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                  <span className="truncate text-sm font-black text-slate-800 dark:text-white">
                    {session.title}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    {formatHoi4SessionDate(session.startTime)}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-indigo-500 dark:text-slate-600 dark:group-hover:text-indigo-400" />
                </div>
              </Link>

              <div className="flex flex-wrap gap-2 px-4 py-3">
                {session.participants.map((p) => {
                  const c =
                    getStreamerColor(p.streamer.id, isDark) ?? p.streamer.colorCode;
                  const resultClass = hoi4ResultBadgeClass(p.result);
                  return (
                    <Link
                      key={p.streamer.id}
                      href={`/streamers/detail/${p.streamer.id}`}
                      scroll={false}
                      onClick={markModalSoftNav}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-white py-1.5 pl-2.5 pr-3 transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-700/50 dark:hover:bg-indigo-950/20"
                    >
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: c }}
                      />
                      <span
                        className="text-xs font-black leading-none"
                        style={{ color: c }}
                      >
                        {p.streamer.name}
                      </span>
                      {p.nation ? (
                        <span className="text-[11px] font-semibold leading-none text-slate-500 dark:text-slate-400">
                          {p.nation}
                        </span>
                      ) : null}
                      {p.result?.trim() ? (
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-black leading-none ${resultClass}`}
                        >
                          {p.result.trim()}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {canLoadMore ? (
        <motion.button
          type="button"
          onClick={onLoadMore}
          {...statsInteractiveHover}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-black text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          더 보기
          <ChevronDown className="h-4 w-4" />
        </motion.button>
      ) : null}
    </motion.section>
  );
}
