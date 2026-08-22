'use client';

import { motion } from 'motion/react';
import { Clock, Globe2, Sword, Users } from 'lucide-react';
import StatsCountUp from '@/components/Calendar/StatsCountUp';
import {
  statsPageHeaderVariants,
  statsTileGridVariants,
  statsTileVariants,
} from '@/lib/statsMotion';

interface Hoi4HeroProps {
  memberCount: number;
  sessionCount: number;
  nationCount: number;
}

export default function Hoi4Hero({
  memberCount,
  sessionCount,
  nationCount,
}: Hoi4HeroProps) {
  const tiles = [
    { icon: Users, label: '참전 멤버', value: memberCount },
    { icon: Clock, label: '총 세션', value: sessionCount },
    { icon: Globe2, label: '플레이 국가', value: nationCount },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={statsPageHeaderVariants}
      className="relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-linear-to-br from-amber-500/10 via-orange-500/5 to-transparent dark:from-amber-500/15 dark:via-orange-900/10" />
      <div className="relative px-4 pb-5 pt-6 text-center sm:pb-7 sm:pt-10">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 shadow-lg shadow-amber-500/10 dark:bg-amber-900/40 sm:mb-4 sm:h-16 sm:w-16 sm:rounded-3xl">
          <Sword className="h-6 w-6 text-amber-500 dark:text-amber-400 sm:h-8 sm:w-8" />
        </div>
        <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl md:text-3xl">
          HOI4 참전 기록
        </h1>
        <p className="mt-1 text-xs font-bold text-slate-400 dark:text-slate-500 sm:text-sm">
          지도동 내전 · 참전 세션 누적
        </p>

        <motion.div
          variants={statsTileGridVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto mt-4 grid max-w-md grid-cols-3 gap-2 sm:mt-5 sm:gap-3"
        >
          {tiles.map(({ icon: Icon, label, value }, i) => (
            <motion.div
              key={label}
              custom={i}
              variants={statsTileVariants}
              className="rounded-2xl border border-amber-100/80 bg-white/80 px-2 py-2.5 shadow-sm dark:border-amber-900/40 dark:bg-slate-900/70 sm:px-3 sm:py-3"
            >
              <Icon className="mx-auto mb-1 h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
              <StatsCountUp
                value={value}
                delay={0.08 + i * 0.05}
                className="block text-lg font-black tabular-nums text-slate-900 dark:text-white sm:text-xl"
              />
              <p className="mt-0.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 sm:text-[11px]">
                {label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
