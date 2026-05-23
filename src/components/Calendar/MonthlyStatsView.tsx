'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  addMonths,
  format,
  isValid,
  parse,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Clock3,
  Download,
  Gamepad2,
  Globe2,
  LineChart,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { Game, Streamer } from '@prisma/client';
import MonthlyWrappedHero, {
  getMonthlyWrapperTheme,
} from '@/components/Calendar/MonthlyWrappedHero';
import StatsCountUp from '@/components/Calendar/StatsCountUp';
import { monthlyWrapperMesh } from '@/lib/monthlyWrapperTheme';
import type { PublicSiteOverview } from '@/lib/data-fetching';
import type { MonthlyClipStats } from '@/lib/monthlyClipStats';
import {
  computeMonthlyWrappedStats,
  type MonthlyWrappedHighlight,
} from '@/lib/monthlyWrappedStats';
import { groupSchedulesByDate } from '@/lib/schedule-formatters';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';
import type { ExtendedSiteContentStats } from '@/lib/siteStats';
import {
  STATS_MONTH_ROW_LAYOUT_ID,
  statsBarVariants,
  statsBusyDayVariants,
  statsColumnVariants,
  statsHeadingVariants,
  statsInteractiveHover,
  statsListVariants,
  statsMonthLabelVariants,
  statsMonthPresenceVariants,
  statsPageHeaderVariants,
  statsRowVariants,
  statsSectionVariants,
  statsSpring,
  statsTableRowVariants,
  statsTileGridVariants,
  statsTileVariants,
  type StatsSlideDirection,
} from '@/lib/statsMotion';
import { downloadSiteStatsExport, type SiteWideReport } from '@/lib/siteWideStats';

interface MonthlyStatsViewProps {
  initialSchedules: FlattenedSchedule[];
  streamers: Streamer[];
  games: Game[];
  initialMonth?: string;
  siteOverview: PublicSiteOverview;
  contentStats: ExtendedSiteContentStats;
  clipStats: MonthlyClipStats;
  siteReport: SiteWideReport;
}

function parseMonthParam(value?: string): Date {
  if (value) {
    const parsed = parse(value, 'yyyy-MM', new Date());
    if (isValid(parsed)) return startOfMonth(parsed);
  }
  return startOfMonth(new Date());
}

function AnimatedSection({
  index,
  title,
  icon,
  children,
  reducedMotion,
  variant = 'default',
}: {
  index: number;
  title: string;
  icon: ReactNode;
  children: ReactNode;
  reducedMotion: boolean;
  variant?: 'default' | 'spotlight';
}) {
  const isSpotlight = variant === 'spotlight';

  return (
    <motion.section
      custom={index}
      initial={reducedMotion ? false : 'hidden'}
      whileInView={reducedMotion ? undefined : 'visible'}
      viewport={{ once: true, margin: '-48px' }}
      variants={isSpotlight ? undefined : statsSectionVariants}
      animate={isSpotlight && !reducedMotion ? { opacity: 1, y: 0 } : undefined}
      className={
        isSpotlight
          ? 'relative -mx-1 sm:-mx-2'
          : 'rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6'
      }
    >
      {!isSpotlight ? (
        <motion.h2
          initial={reducedMotion ? false : 'hidden'}
          whileInView={reducedMotion ? undefined : 'visible'}
          viewport={{ once: true }}
          variants={statsHeadingVariants}
          className="mb-4 flex items-center gap-2 text-sm font-black text-slate-800 dark:text-white"
        >
          {icon}
          {title}
        </motion.h2>
      ) : null}
      {children}
    </motion.section>
  );
}

function StatTile({
  label,
  value,
  countUp,
  suffix = '',
  countDelay = 0,
  sub,
  reducedMotion,
  accent,
}: {
  label: string;
  value?: string;
  countUp?: number;
  suffix?: string;
  countDelay?: number;
  sub?: string;
  reducedMotion: boolean;
  accent?: string;
}) {
  return (
    <motion.div
      variants={statsTileVariants}
      {...(reducedMotion ? {} : statsInteractiveHover)}
      className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/40"
      style={
        accent
          ? ({
              ['--tile-accent' as string]: accent,
            } as React.CSSProperties)
          : undefined
      }
    >
      {accent ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 18%, transparent) 0%, transparent 65%)`,
          }}
        />
      ) : null}
      <p className="relative text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className="relative mt-1 text-lg font-black tabular-nums text-slate-900 dark:text-white">
        {countUp !== undefined ? (
          <>
            <StatsCountUp value={countUp} delay={countDelay} />
            {suffix}
          </>
        ) : (
          value
        )}
      </p>
      {sub ? (
        <p className="relative mt-0.5 text-[10px] font-bold text-slate-400 dark:text-slate-500">{sub}</p>
      ) : null}
    </motion.div>
  );
}

type StatTileItem = {
  label: string;
  value?: string;
  countUp?: number;
  suffix?: string;
  countDelay?: number;
  sub?: string;
};

function StatTileGrid({
  tiles,
  reducedMotion,
  columns = 4,
  accent,
}: {
  tiles: StatTileItem[];
  reducedMotion: boolean;
  columns?: 3 | 4;
  accent?: string;
}) {
  const gridClass = columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-4';
  return (
    <motion.div
      className={`grid grid-cols-2 gap-2 ${gridClass}`}
      variants={statsTileGridVariants}
      initial={reducedMotion ? false : 'hidden'}
      whileInView={reducedMotion ? undefined : 'visible'}
      viewport={{ once: true }}
    >
      {tiles.map((tile) => (
        <StatTile key={tile.label} {...tile} reducedMotion={reducedMotion} accent={accent} />
      ))}
    </motion.div>
  );
}

function HighlightGrid({
  items,
  reducedMotion,
  accent,
}: {
  items: MonthlyWrappedHighlight[];
  reducedMotion: boolean;
  accent?: string;
}) {
  return (
    <motion.div
      className="grid grid-cols-2 gap-2 sm:grid-cols-3"
      variants={statsTileGridVariants}
      initial={reducedMotion ? false : 'hidden'}
      whileInView={reducedMotion ? undefined : 'visible'}
      viewport={{ once: true }}
    >
      {items.map((item) => (
        <StatTile
          key={item.label}
          label={item.label}
          value={item.value}
          sub={item.sub}
          reducedMotion={reducedMotion}
          accent={accent}
        />
      ))}
    </motion.div>
  );
}

function RankedList({
  items,
  emptyLabel,
  accent,
  unit = '회',
  reducedMotion,
}: {
  items: { name: string; count: number; pct: number }[];
  emptyLabel: string;
  accent: string;
  unit?: string;
  reducedMotion: boolean;
}) {
  if (items.length === 0) {
    return <p className="text-sm font-bold text-slate-400 dark:text-slate-500">{emptyLabel}</p>;
  }

  return (
    <motion.ol
      className="space-y-3"
      variants={statsListVariants}
      initial={reducedMotion ? false : 'hidden'}
      whileInView={reducedMotion ? undefined : 'visible'}
      viewport={{ once: true }}
    >
      {items.map((item, idx) => (
        <motion.li key={`${item.name}-${idx}`} variants={statsRowVariants} className="flex items-center gap-3">
          <motion.span
            initial={reducedMotion ? false : { scale: 0.6, opacity: 0 }}
            whileInView={reducedMotion ? undefined : { scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={statsSpring(idx * 0.04, 400, 26)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          >
            {idx + 1}
          </motion.span>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-black text-slate-800 dark:text-white">{item.name}</p>
              <p className="shrink-0 text-xs font-bold text-slate-500 dark:text-slate-400">
                {item.count}
                {unit}
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <motion.div
                className="h-full w-full rounded-full"
                style={{ backgroundColor: accent, transformOrigin: '0% 50%' }}
                custom={item.pct}
                variants={statsBarVariants}
                initial={reducedMotion ? false : 'hidden'}
                whileInView={reducedMotion ? undefined : 'visible'}
                viewport={{ once: true }}
              />
            </div>
          </div>
        </motion.li>
      ))}
    </motion.ol>
  );
}

export default function MonthlyStatsView({
  initialSchedules,
  streamers,
  games,
  initialMonth,
  siteOverview,
  contentStats,
  clipStats,
  siteReport,
}: MonthlyStatsViewProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const monthlySectionRef = useRef<HTMLDivElement>(null);
  const [month, setMonth] = useState(() => parseMonthParam(initialMonth));
  const [slideDirection, setSlideDirection] = useState<StatsSlideDirection>('left');

  const schedulesByDate = useMemo(
    () => groupSchedulesByDate(initialSchedules),
    [initialSchedules],
  );

  const stats = useMemo(
    () => computeMonthlyWrappedStats(schedulesByDate, month),
    [month, schedulesByDate],
  );

  const theme = getMonthlyWrapperTheme(month);
  const monthKey = format(month, 'yyyy-MM');
  const monthTitle = format(month, 'yyyy년 M월', { locale: ko });

  const syncMonth = useCallback(
    (next: Date, direction: StatsSlideDirection) => {
      const normalized = startOfMonth(next);
      setSlideDirection(direction);
      setMonth(normalized);
      router.replace(`/calendar/monthly?month=${format(normalized, 'yyyy-MM')}`, {
        scroll: false,
      });
    },
    [router],
  );

  const goPrev = useCallback(() => syncMonth(subMonths(month, 1), 'right'), [month, syncMonth]);
  const goNext = useCallback(() => syncMonth(addMonths(month, 1), 'left'), [month, syncMonth]);
  const goToday = () => {
    const today = startOfMonth(new Date());
    if (format(today, 'yyyy-MM') === monthKey) return;
    setSlideDirection(today > month ? 'left' : 'right');
    setMonth(today);
    router.replace(`/calendar/monthly?month=${format(today, 'yyyy-MM')}`, { scroll: false });
  };

  const scrollToMonthlySection = useCallback(() => {
    monthlySectionRef.current?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }, [reducedMotion]);

  const handleTrendMonthClick = useCallback(
    (rowMonth: string) => {
      if (rowMonth === monthKey) {
        scrollToMonthlySection();
        return;
      }
      const parsed = startOfMonth(parse(rowMonth, 'yyyy-MM', new Date()));
      if (!isValid(parsed)) return;
      syncMonth(parsed, parsed > month ? 'left' : 'right');
      window.requestAnimationFrame(() => scrollToMonthlySection());
    },
    [month, monthKey, scrollToMonthlySection, syncMonth],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }
      event.preventDefault();
      if (event.key === 'ArrowLeft') goPrev();
      else goNext();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrev]);

  const handleExport = () => downloadSiteStatsExport(siteReport);

  const dataRangeLabel =
    siteReport.dataRange.scheduleFrom && siteReport.dataRange.scheduleTo
      ? `${siteReport.dataRange.scheduleFrom} ~ ${siteReport.dataRange.scheduleTo}`
      : '일정 데이터 없음';

  return (
    <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 pb-16 sm:px-6 sm:py-8 sm:pb-20">
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {monthTitle} 통계
      </p>
      {/* 월 테마 앰비언트 글로우 */}
      {!reducedMotion ? (
        <motion.div
          key={`ambient-${monthKey}`}
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={statsSpring(0, 300, 34)}
          className="pointer-events-none absolute inset-x-0 top-[38%] -z-10 h-[520px] blur-3xl"
          style={{ background: monthlyWrapperMesh(theme) }}
        />
      ) : null}

      <motion.header
        initial={reducedMotion ? false : 'hidden'}
        animate="visible"
        variants={statsPageHeaderVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <Link
            href="/calendar"
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
            aria-label="캘린더로 돌아가기"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400">
              <BarChart3 className="h-3 w-3" />
              지도동 통계
            </p>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              지도동 통계
            </h1>
            <motion.div
              key={monthKey}
              initial={reducedMotion ? false : { opacity: 0.6, scaleX: 0.75 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={statsSpring(0, 320, 32)}
              className="mt-1.5 h-0.5 w-16 origin-left rounded-full"
              style={{ background: `linear-gradient(90deg, ${theme.accent}, ${theme.to})` }}
            />
            <p className="mt-0.5 text-xs font-bold text-slate-400 dark:text-slate-500">
              전체 누적 +{' '}
              <AnimatePresence mode="wait" initial={false} custom={slideDirection}>
                <motion.span
                  key={monthKey}
                  custom={slideDirection}
                  variants={statsMonthLabelVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="inline-block text-slate-600 dark:text-slate-300"
                >
                  {monthTitle}
                </motion.span>
              </AnimatePresence>
              {' '}· {dataRangeLabel}
              <span className="hidden sm:inline"> · ← → 월 이동</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <motion.button
            type="button"
            onClick={handleExport}
            {...(reducedMotion ? {} : statsInteractiveHover)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition-colors hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
          >
            <Download className="h-4 w-4" />
            JSON 내보내기
          </motion.button>
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900"
            style={{ boxShadow: `0 0 0 1px ${theme.accent}22` }}
          >
            <motion.button
              type="button"
              onClick={goPrev}
              whileTap={reducedMotion ? undefined : { scale: 0.9, x: -1 }}
              transition={statsSpring(0, 500, 28)}
              className="rounded-lg p-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
              aria-label="이전 달"
            >
              <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </motion.button>
            <motion.button
              type="button"
              onClick={goNext}
              whileTap={reducedMotion ? undefined : { scale: 0.9, x: 1 }}
              transition={statsSpring(0, 500, 28)}
              className="rounded-lg p-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
              aria-label="다음 달"
            >
              <ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </motion.button>
          </div>
          <motion.button
            type="button"
            onClick={goToday}
            whileTap={reducedMotion ? undefined : { scale: 0.96 }}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-500 transition-colors hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
          >
            이번 달
          </motion.button>
        </div>
      </motion.header>

      <AnimatedSection index={0} title="사이트 누적" icon={<Globe2 className="h-4 w-4 text-sky-500" />} reducedMotion={!!reducedMotion}>
        <StatTileGrid
          reducedMotion={!!reducedMotion}
          accent={theme.accent}
          tiles={[
            { label: '등록 일정', countUp: siteOverview.scheduleCount, suffix: '개', countDelay: 0.04, sub: '전체 DB' },
            { label: '등록 클립', countUp: siteOverview.clipCount, suffix: '개', countDelay: 0.08, sub: '전체 아카이브' },
            { label: '지도동 멤버', countUp: siteOverview.memberCount, suffix: '명', countDelay: 0.12, sub: `게스트 제외 · 전체 ${streamers.length}명` },
            { label: '게임', countUp: siteOverview.gameCount, suffix: '종', countDelay: 0.16, sub: `등록 게임 ${games.length}종` },
          ]}
        />
      </AnimatedSection>

      <AnimatedSection index={1} title="전체 기간 TOP" icon={<TrendingUp className="h-4 w-4 text-orange-500" />} reducedMotion={!!reducedMotion}>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-xs font-black text-slate-600 dark:text-slate-300">
              <Users className="h-3.5 w-3.5 text-indigo-500" />
              누적 TOP 멤버
            </p>
            <RankedList
              items={siteReport.topStreamersAllTime.slice(0, 5)}
              emptyLabel="일정 데이터가 없어요"
              accent={theme.accent}
              reducedMotion={!!reducedMotion}
            />
          </div>
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-xs font-black text-slate-600 dark:text-slate-300">
              <Gamepad2 className="h-3.5 w-3.5 text-emerald-500" />
              누적 TOP 게임
            </p>
            <RankedList
              items={siteReport.topGamesAllTime.slice(0, 5)}
              emptyLabel="게임 일정이 없어요"
              accent={theme.to}
              reducedMotion={!!reducedMotion}
            />
          </div>
        </div>
      </AnimatedSection>

      {siteReport.monthlyTrend.length > 0 ? (
        <LayoutGroup id="stats-monthly-trend">
        <AnimatedSection index={2} title="월별 추이" icon={<LineChart className="h-4 w-4 text-cyan-500" />} reducedMotion={!!reducedMotion}>
          <div className="overflow-x-auto">
            <table className="relative w-full min-w-[480px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wide text-slate-400 dark:border-slate-800">
                  <th className="pb-2 pr-3">월</th>
                  <th className="pb-2 pr-3">일정</th>
                  <th className="pb-2 pr-3">클립</th>
                  <th className="pb-2 pr-3">활동일</th>
                  <th className="pb-2">멤버</th>
                </tr>
              </thead>
              <tbody>
                {siteReport.monthlyTrend.map((row, idx) => {
                  const isSelected = row.month === monthKey;
                  return (
                    <motion.tr
                      key={row.month}
                      custom={idx}
                      variants={statsTableRowVariants}
                      initial={reducedMotion ? false : 'hidden'}
                      whileInView={reducedMotion ? undefined : 'visible'}
                      viewport={{ once: true }}
                      className="relative border-b border-slate-50 dark:border-slate-800/80"
                    >
                      {isSelected ? (
                        <td colSpan={5} className="absolute inset-0 p-0" aria-hidden>
                          <motion.div
                            layoutId={STATS_MONTH_ROW_LAYOUT_ID}
                            className="absolute inset-0 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/35"
                            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                          />
                        </td>
                      ) : null}
                      <td className="relative py-2.5 pr-3">
                        <button
                          type="button"
                          onClick={() => handleTrendMonthClick(row.month)}
                          className={`relative z-10 cursor-pointer font-black transition-colors ${
                            isSelected
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-slate-700 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-400'
                          }`}
                        >
                          {row.label}
                        </button>
                      </td>
                      <td className="relative z-10 py-2.5 pr-3 font-bold text-slate-600 dark:text-slate-300">{row.scheduleCount}</td>
                      <td className="relative z-10 py-2.5 pr-3 font-bold text-slate-600 dark:text-slate-300">{row.clipCount}</td>
                      <td className="relative z-10 py-2.5 pr-3 font-bold text-slate-600 dark:text-slate-300">{row.activeDays}</td>
                      <td className="relative z-10 py-2.5 font-bold text-slate-600 dark:text-slate-300">{row.uniqueStreamers}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[10px] font-bold text-slate-400 dark:text-slate-500">
            API:{' '}
            <a href="/api/stats/site" className="text-indigo-600 hover:underline dark:text-indigo-400" target="_blank" rel="noopener noreferrer">
              /api/stats/site
            </a>
            {' '}· JSON 공개
          </p>
        </AnimatedSection>
        </LayoutGroup>
      ) : null}

      <AnimatedSection index={3} title="콘텐츠 누적 상세" icon={<BarChart3 className="h-4 w-4 text-teal-500" />} reducedMotion={!!reducedMotion}>
        <StatTileGrid
          reducedMotion={!!reducedMotion}
          columns={3}
          accent={theme.via}
          tiles={[
            { label: '합방 / 솔로', value: `${contentStats.collabScheduleCount} / ${contentStats.soloScheduleCount}`, sub: '2인 이상 · 1인' },
            { label: '게임 연결', countUp: contentStats.gameLinkedScheduleCount, suffix: '개', countDelay: 0.04, sub: `HOI4 ${contentStats.hoi4ScheduleCount}회` },
            { label: '게릴라', countUp: contentStats.guerrillaCount, suffix: '개', countDelay: 0.08, sub: '시간 미정' },
            { label: '내전', countUp: contentStats.naejeonCount, suffix: '회', countDelay: 0.12, sub: '내전 플래그' },
            { label: '평균 참여', value: `${contentStats.avgParticipantsPerSchedule}명`, sub: '합방당' },
            { label: '게스트', countUp: contentStats.guestStreamerCount, suffix: '명', countDelay: 0.16, sub: '등록 멤버' },
          ]}
        />
      </AnimatedSection>

      <AnimatePresence mode="wait" custom={slideDirection} initial={false}>
        <motion.div
          ref={monthlySectionRef}
          key={monthKey}
          custom={slideDirection}
          variants={statsMonthPresenceVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="flex scroll-mt-6 flex-col gap-5"
        >
          <LayoutGroup id="monthly-stats">
          <AnimatedSection
            index={4}
            title={`${monthTitle} 요약`}
            icon={<CalendarDays className="h-4 w-4 text-indigo-500" />}
            reducedMotion={!!reducedMotion}
            variant="spotlight"
          >
            <MonthlyWrappedHero month={month} stats={stats} variant="page" />
          </AnimatedSection>

          <AnimatedSection index={5} title="이번 달 자세히" icon={<BarChart3 className="h-4 w-4 text-indigo-500" />} reducedMotion={!!reducedMotion}>
            <HighlightGrid items={stats.detailHighlights} reducedMotion={!!reducedMotion} accent={theme.accent} />
          </AnimatedSection>

          <div className="grid gap-5 sm:grid-cols-2">
            <AnimatedSection index={6} title="TOP 멤버" icon={<Users className="h-4 w-4 text-indigo-500" />} reducedMotion={!!reducedMotion}>
              <RankedList items={stats.topStreamersRanked} emptyLabel="이번 달 출연 기록이 없어요" accent={theme.accent} reducedMotion={!!reducedMotion} />
            </AnimatedSection>
            <AnimatedSection index={7} title="TOP 게임" icon={<Gamepad2 className="h-4 w-4 text-emerald-500" />} reducedMotion={!!reducedMotion}>
              <RankedList items={stats.topGamesRanked} emptyLabel="이번 달 게임 일정이 없어요" accent={theme.to} reducedMotion={!!reducedMotion} />
            </AnimatedSection>
          </div>

          <AnimatedSection index={8} title="클립" icon={<Clapperboard className="h-4 w-4 text-rose-500" />} reducedMotion={!!reducedMotion}>
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <motion.div className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-3 sm:grid-cols-3" variants={statsTileGridVariants} initial="hidden" animate="visible">
                <StatTile reducedMotion={!!reducedMotion} label="이번 달 클립" value={`${clipStats.count}개`} sub="등록 기준" accent={theme.accent} />
                <StatTile reducedMotion={!!reducedMotion} label="게임 없는 일정" value={`${stats.withoutGameCount}개`} sub="자유 방송" accent={theme.accent} />
                <StatTile reducedMotion={!!reducedMotion} label="내전" value={`${stats.naejeonCount}회`} sub="이번 달" accent={theme.accent} />
              </motion.div>
            </div>
            <RankedList items={clipStats.topStreamers} emptyLabel="이번 달 등록된 클립이 없어요" accent="#fb7185" unit="개" reducedMotion={!!reducedMotion} />
            <Link href={`/clips?month=${monthKey}`} className="mt-4 inline-flex items-center gap-1.5 text-xs font-black text-indigo-600 hover:underline dark:text-indigo-400">
              클립 목록에서 보기
            </Link>
          </AnimatedSection>

          <AnimatedSection index={9} title="요일별 일정" icon={<BarChart3 className="h-4 w-4 text-violet-500" />} reducedMotion={!!reducedMotion}>
            <div className="grid grid-cols-7 gap-2">
              {stats.weekdayBreakdown.map((day, idx) => (
                <motion.div
                  key={day.label}
                  initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={statsSpring(idx * 0.04, 300, 32)}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="flex h-24 w-full items-end justify-center overflow-hidden rounded-2xl bg-slate-50 px-1 dark:bg-slate-800/80">
                    <motion.div
                      className="h-24 w-full max-w-8 rounded-t-xl shadow-[0_-4px_16px_-4px]"
                      style={{
                        backgroundColor: theme.via,
                        boxShadow: `0 -4px 16px -4px ${theme.accent}66`,
                        transformOrigin: '50% 100%',
                      }}
                      custom={day.pct}
                      variants={statsColumnVariants}
                      initial={reducedMotion ? false : 'hidden'}
                      animate="visible"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-black text-slate-700 dark:text-slate-200">{day.short}</p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{day.count}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>

          <AnimatedSection index={10} title="시간대별 일정" icon={<Clock3 className="h-4 w-4 text-amber-500" />} reducedMotion={!!reducedMotion}>
            <div className="space-y-3">
              {stats.timeBuckets.map((bucket, idx) => (
                <motion.div
                  key={bucket.label}
                  initial={reducedMotion ? false : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={statsSpring(idx * 0.05, 300, 34)}
                >
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <p className="text-xs font-black text-slate-700 dark:text-slate-200">{bucket.label}</p>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500">{bucket.count}개</p>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <motion.div
                      className="h-full w-full rounded-full"
                      style={{ backgroundColor: theme.accent, transformOrigin: '0% 50%' }}
                      custom={bucket.pct}
                      variants={statsBarVariants}
                      initial={reducedMotion ? false : 'hidden'}
                      animate="visible"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>

          {stats.busiestDaysRanked.length > 0 ? (
            <AnimatedSection index={11} title="바쁜 날 TOP 5" icon={<CalendarDays className="h-4 w-4 text-orange-500" />} reducedMotion={!!reducedMotion}>
              <motion.ol
                className="space-y-2"
                variants={statsListVariants}
                initial={reducedMotion ? false : 'hidden'}
                animate="visible"
              >
                {stats.busiestDaysRanked.map((day, idx) => (
                  <motion.li
                    key={day.dateKey}
                    custom={idx}
                    variants={statsBusyDayVariants}
                    {...(reducedMotion ? {} : statsInteractiveHover)}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-[10px] font-black text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-black text-slate-800 dark:text-white">{day.label}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{day.count}개</span>
                  </motion.li>
                ))}
              </motion.ol>
            </AnimatedSection>
          ) : null}
          </LayoutGroup>
        </motion.div>
      </AnimatePresence>

      <motion.section
        custom={12}
        initial={reducedMotion ? false : 'hidden'}
        whileInView={reducedMotion ? undefined : 'visible'}
        viewport={{ once: true, margin: '-48px' }}
        variants={statsSectionVariants}
        className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/60 sm:p-6"
      >
        <motion.h2
          variants={statsHeadingVariants}
          initial={reducedMotion ? false : 'hidden'}
          whileInView={reducedMotion ? undefined : 'visible'}
          viewport={{ once: true }}
          className="mb-3 text-sm font-black text-slate-800 dark:text-white"
        >
          집계 기준
        </motion.h2>
        <motion.ul
          className="space-y-2 text-xs font-bold text-slate-500 dark:text-slate-400"
          variants={statsListVariants}
          initial={reducedMotion ? false : 'hidden'}
          whileInView={reducedMotion ? undefined : 'visible'}
          viewport={{ once: true }}
        >
          <motion.li variants={statsRowVariants}>· 월간 수치는 해당 달 캘린더·클립 데이터를 필터 없이 집계합니다</motion.li>
          <motion.li variants={statsRowVariants}>· 콘텐츠 누적은 등록된 일정·클립·멤버·게임 DB 기준입니다</motion.li>
          <motion.li variants={statsRowVariants}>· JSON 내보내기와 /api/stats/site 에 동일 리포트가 제공됩니다</motion.li>
        </motion.ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <motion.div {...(reducedMotion ? {} : statsInteractiveHover)}>
          <Link href="/calendar" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700">
            <CalendarDays className="h-4 w-4" />
            캘린더에서 일정 보기
          </Link>
          </motion.div>
          <motion.div {...(reducedMotion ? {} : statsInteractiveHover)}>
          <Link
            href={`/clips?month=${monthKey}`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
          >
            <Clapperboard className="h-4 w-4" />
            이번 달 클립
          </Link>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
