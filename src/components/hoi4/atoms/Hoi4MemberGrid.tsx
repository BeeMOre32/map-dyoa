'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Medal } from 'lucide-react';
import { useTheme } from '@teispace/next-themes';
import StreamerAvatar from '@/components/streamer/StreamerAvatar';
import { getStreamerColor } from '@/constants/streamercolor';
import { getStreamerImagePath } from '@/lib/utils';
import type { Hoi4LeaderboardData } from '@/lib/data-fetching';
import {
  hoi4MemberGridClass,
  hoi4RankLabel,
} from '@/lib/hoi4/hoi4ViewUtils';
import { markModalSoftNav } from '@/lib/modal-navigation';
import {
  statsListVariants,
  statsRowVariants,
  statsSectionVariants,
} from '@/lib/statsMotion';
interface Hoi4MemberGridProps {
  entries: Hoi4LeaderboardData['leaderboard'];
  maxParticipations: number;
}

export default function Hoi4MemberGrid({
  entries,
  maxParticipations,
}: Hoi4MemberGridProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <motion.section
      custom={0}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={statsSectionVariants}
      className="space-y-3"
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <Medal className="h-4 w-4 text-amber-500" />
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
            멤버 · 플레이 국가
          </p>
        </div>
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
          탭하면 멤버 상세
        </span>
      </div>

      <motion.div
        variants={statsListVariants}
        initial="hidden"
        animate="visible"
        className={hoi4MemberGridClass(entries.length)}
      >
        {entries.map((entry, index) => {
          const color =
            getStreamerColor(entry.streamer.id, isDark) ?? entry.streamer.colorCode;
          const medal = hoi4RankLabel(index);

          return (
            <motion.div
              key={entry.streamer.id}
              custom={index}
              variants={statsRowVariants}
              className="min-w-0"
            >
              <Link
                href={`/streamers/detail/${entry.streamer.id}`}
                scroll={false}
                onClick={markModalSoftNav}
                className="group relative flex h-full flex-col items-center gap-2 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center transition-[border-color,box-shadow,transform] hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700/60"
              >
                {medal ? (
                  <span className="absolute right-2 top-2 text-sm leading-none">
                    {medal}
                  </span>
                ) : (
                  <span className="absolute right-2 top-2 text-[10px] font-black tabular-nums text-slate-300 dark:text-slate-600">
                    {index + 1}
                  </span>
                )}

                <StreamerAvatar
                  name={entry.streamer.name}
                  imgSrc={getStreamerImagePath(entry.streamer.name)}
                  colorCode={entry.streamer.colorCode}
                  streamerId={entry.streamer.id}
                  size="small"
                />

                <div className="min-w-0 w-full space-y-1">
                  <p
                    className="truncate text-sm font-black leading-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                    style={{ color }}
                  >
                    {entry.streamer.name}
                  </p>
                  <p className="text-[10px] font-black tabular-nums text-slate-400 dark:text-slate-500">
                    {entry.total}회 참전
                  </p>
                </div>

                <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{
                      width: `${Math.max(8, (entry.total / maxParticipations) * 100)}%`,
                    }}
                    viewport={{ once: true }}
                    transition={{
                      type: 'spring',
                      stiffness: 120,
                      damping: 24,
                      delay: 0.08,
                    }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </div>

                {entry.nations.length > 0 ? (
                  <div className="flex min-h-[2.25rem] w-full flex-wrap justify-center gap-1">
                    {entry.nations.slice(0, 3).map((n) => (
                      <span
                        key={n}
                        className="max-w-full truncate rounded-md border border-amber-100 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400"
                      >
                        {n}
                      </span>
                    ))}
                    {entry.nations.length > 3 ? (
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">
                        +{entry.nations.length - 3}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <span className="min-h-[2.25rem] text-[10px] font-medium text-slate-300 dark:text-slate-600">
                    국가 미등록
                  </span>
                )}

                <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-indigo-500 opacity-0 transition-opacity group-hover:opacity-100 dark:text-indigo-400">
                  멤버 상세
                  <ArrowUpRight className="h-3 w-3" />
                </span>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.section>
  );
}
