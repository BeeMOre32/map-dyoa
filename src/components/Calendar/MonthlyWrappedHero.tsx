'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import StatsCountUp from '@/components/Calendar/StatsCountUp';
import type { MonthlyWrappedStats } from '@/lib/monthlyWrappedStats';
import {
  getMonthlyWrapperTheme,
  monthlyWrapperGlow,
  monthlyWrapperGradient,
  monthlyWrapperMesh,
} from '@/lib/monthlyWrapperTheme';
import {
  statsHeadingVariants,
  statsInteractiveHover,
  statsSpring,
  statsTileGridVariants,
  statsTileVariants,
  statsWrappedHeroPresence,
  statsWrappedOrbMotion,
  statsWrappedShimmerMotion,
} from '@/lib/statsMotion';

interface MonthlyWrappedHeroProps {
  month: Date;
  stats: MonthlyWrappedStats;
  /** full page uses wider padding and no outer rounding */
  variant?: 'embedded' | 'page';
}

export default function MonthlyWrappedHero({
  month,
  stats,
  variant = 'embedded',
}: MonthlyWrappedHeroProps) {
  const reducedMotion = useReducedMotion();
  const theme = getMonthlyWrapperTheme(month);
  const monthKey = format(month, 'yyyy-MM');
  const monthLabel = format(month, 'M월', { locale: ko });
  const yearLabel = format(month, 'yyyy');
  const hasSchedules = stats.scheduleCount > 0;
  const isPage = variant === 'page';

  return (
    <motion.div
      layout
      initial={reducedMotion ? false : 'hidden'}
      animate="visible"
      variants={statsWrappedHeroPresence}
      className={
        isPage
          ? 'relative overflow-hidden rounded-[1.75rem] border border-white/15 px-5 py-7 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.45)] sm:rounded-4xl sm:px-8 sm:py-9'
          : 'relative shrink-0 overflow-hidden px-4 pb-4 pt-4 sm:px-6 sm:pb-5 sm:pt-5'
      }
      style={{
        background: monthlyWrapperGradient(theme),
        boxShadow: isPage ? monthlyWrapperGlow(theme) : undefined,
      }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{ background: monthlyWrapperMesh(theme) }}
        animate={
          reducedMotion
            ? undefined
            : { opacity: [0.5, 0.8, 0.5], scale: [1, 1.03, 1] }
        }
        transition={
          reducedMotion ? undefined : { duration: 7, repeat: Infinity, ease: 'easeInOut' }
        }
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-size-[20px_20px]"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-black/55 via-black/28 to-black/60"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/45 via-transparent to-black/25"
      />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full blur-3xl"
        style={{ backgroundColor: theme.accent, opacity: 0.3 }}
        {...(reducedMotion ? {} : statsWrappedOrbMotion)}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-8 left-1/5 h-28 w-28 rounded-full blur-2xl"
        style={{ backgroundColor: theme.to, opacity: 0.22 }}
        {...(reducedMotion
          ? {}
          : {
              animate: { x: [0, -12, 6, 0], y: [0, 10, -6, 0] },
              transition: { duration: 12, repeat: Infinity, ease: 'easeInOut' },
            })}
      />

      {!reducedMotion ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-18deg] bg-linear-to-r from-transparent via-white/10 to-transparent"
          {...statsWrappedShimmerMotion}
        />
      ) : null}

      <div className="relative z-10">
        <motion.p
          initial={reducedMotion ? false : 'hidden'}
          animate="visible"
          variants={statsHeadingVariants}
          className="mb-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-white/90 drop-shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5 text-white" />
          {yearLabel} · Monthly Wrapped
        </motion.p>

        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <motion.p
              layoutId={`wrapped-month-${monthKey}`}
              initial={reducedMotion ? false : 'hidden'}
              animate="visible"
              variants={statsTileVariants}
              className="bg-linear-to-br from-white via-white to-white/75 bg-clip-text text-[clamp(3rem,10vw,4.5rem)] font-black leading-[0.88] tracking-tight text-transparent drop-shadow-lg"
            >
              {monthLabel}
            </motion.p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/75">
              지도동 합방 리포트
            </p>
          </div>
          <motion.div
            initial={reducedMotion ? false : 'hidden'}
            animate="visible"
            variants={statsTileVariants}
            {...(reducedMotion ? {} : statsInteractiveHover)}
            className="rounded-2xl border border-white/25 bg-black/35 px-3 py-2.5 text-right backdrop-blur-md"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/75">활동일</p>
            <p className="text-2xl font-black tabular-nums text-white">
              <StatsCountUp value={stats.activeDays} delay={0.12} />
              <span className="ml-0.5 text-sm">일</span>
            </p>
          </motion.div>
        </div>

        <motion.div
          layoutId={`wrapped-main-stat-${monthKey}`}
          initial={reducedMotion ? false : 'hidden'}
          animate="visible"
          variants={statsTileVariants}
          transition={statsSpring(0.08, 300, 30)}
          className="relative mb-5 overflow-hidden rounded-2xl border border-white/30 bg-black/45 px-4 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-md sm:px-6 sm:py-6"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl"
            style={{ backgroundColor: theme.accent, opacity: 0.35 }}
          />
          <p className="relative text-[10px] font-black uppercase tracking-[0.22em] text-white/85">
            이번 달 합방
          </p>
          <p
            className="relative mt-1 flex items-baseline font-black leading-none tracking-tight text-white"
            style={{
              fontSize: 'clamp(3.25rem, 15vw, 5rem)',
              textShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 48px ${theme.accent}55`,
            }}
          >
            <StatsCountUp value={stats.scheduleCount} delay={0.16} />
            <span className="ml-1.5 text-[0.38em] font-black text-white/95">회</span>
          </p>
          <p className="relative mt-2.5 text-xs font-bold text-white/90">
            {hasSchedules ? (
              <>
                멤버{' '}
                <StatsCountUp value={stats.uniqueStreamers} delay={0.28} className="tabular-nums" />
                명 · {stats.activeDays}일 동안 일정
              </>
            ) : (
              '이번 달 등록된 일정이 없어요'
            )}
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3"
          variants={statsTileGridVariants}
          initial={reducedMotion ? false : 'hidden'}
          animate="visible"
        >
          {stats.highlights.map((item) => (
            <motion.div
              key={`${monthKey}-${item.label}`}
              variants={statsTileVariants}
              {...(reducedMotion ? {} : statsInteractiveHover)}
              className="group relative min-w-0 overflow-hidden rounded-2xl border border-white/25 bg-black/40 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md sm:p-4"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: `linear-gradient(135deg, ${theme.accent}22 0%, transparent 60%)`,
                }}
              />
              <p className="relative text-[9px] font-black uppercase tracking-[0.18em] text-white/80">
                {item.label}
              </p>
              <p className="relative mt-1 truncate text-base font-black leading-tight text-white drop-shadow-sm sm:text-lg">
                {item.value}
              </p>
              {item.sub ? (
                <p className="relative mt-0.5 truncate text-[10px] font-bold text-white/75">{item.sub}</p>
              ) : null}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

export { getMonthlyWrapperTheme };
