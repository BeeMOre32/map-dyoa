// src/components/calendar/CalendarView.tsx
'use client';

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useOptimistic,
  useTransition,
  useRef,
} from 'react';
import { useLiveStatus } from '@/hooks/useLiveStatus';
import { useHideEndedStreams } from '@/hooks/useHideEndedStreams';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  addDays,
  isToday,
  addWeeks,
  subWeeks,
  isValid,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Lock,
  X,
  Clock3,
  Calendar as CalendarIcon,
  LayoutGrid,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { calendarColumnVariants, calendarGridSlide } from '@/lib/calendarMotion';
import { useSession } from 'next-auth/react';

import ScheduleFormModal from '@/components/Form/CreateScheduleModal';
import ScheduleCard from '@/components/Calendar/ScheduleCard';
import ScheduleCardV2 from '@/components/Calendar/ScheduleCardV2';
import FilterBar from '@/components/Calendar/FilterBar';
import { useLegacyCalendarUi } from '@/hooks/useLegacyCalendarUi';
import CalendarWelcomeBanner from '@/components/Calendar/CalendarWelcomeBanner';
import { useFavoriteStreamers } from '@/hooks/useFavoriteStreamers';
import { useToast } from '@/components/Common/Toaster';

import type { Streamer, Game } from '@prisma/client';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';

interface CalendarViewProps {
  initialSchedules: FlattenedSchedule[];
  streamers: Streamer[];
  games: Game[];
}

const CALENDAR_PREFERENCES_KEY = 'calendar:view-preferences:v1';

export default function CalendarView({
  initialSchedules,
  streamers,
  games,
}: CalendarViewProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  const [, startTransition] = useTransition();

  const [optimisticSchedules, addOptimisticSchedule] = useOptimistic(
    initialSchedules,
    (state: FlattenedSchedule[], newSchedule: FlattenedSchedule) => [
      ...state,
      newSchedule,
    ],
  );

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState<
    FlattenedSchedule | undefined
  >(undefined);
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>(
    'left',
  );
  const [selectedStreamers, setSelectedStreamers] = useState<Set<string>>(
    new Set(),
  );
  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set());
  const [isMobileFabOpen, setIsMobileFabOpen] = useState(false);
  const { liveIds: liveStreamerIds } = useLiveStatus();
  const [hideEnded] = useHideEndedStreams();
  const { favorites, favoriteIds, toggle: toggleFavorite } = useFavoriteStreamers();

  const applyFavorites = useCallback(() => {
    if (favorites.length === 0) return;
    setSelectedStreamers(new Set(favorites));
  }, [favorites]);
  const todayMobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CALENDAR_PREFERENCES_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        viewMode?: 'weekly' | 'monthly';
        selectedStreamers?: string[];
        selectedGames?: string[];
      };

      if (parsed.viewMode === 'weekly' || parsed.viewMode === 'monthly') {
        setViewMode(parsed.viewMode);
      }
      if (Array.isArray(parsed.selectedStreamers)) {
        setSelectedStreamers(new Set(parsed.selectedStreamers));
      }
      if (Array.isArray(parsed.selectedGames)) {
        setSelectedGames(new Set(parsed.selectedGames));
      }
    } catch {
      localStorage.removeItem(CALENDAR_PREFERENCES_KEY);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(
      CALENDAR_PREFERENCES_KEY,
      JSON.stringify({
        viewMode,
        selectedStreamers: [...selectedStreamers],
        selectedGames: [...selectedGames],
      }),
    );
  }, [mounted, viewMode, selectedStreamers, selectedGames]);

  useEffect(() => {
    if (viewMode === 'weekly' && todayMobileRef.current) {
      todayMobileRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [viewMode, currentDate]);

  const handleStreamerToggle = useCallback((id: string) => {
    setSelectedStreamers((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleGameToggle = useCallback((id: string) => {
    setSelectedGames((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const nextPeriod = useCallback(() => {
    setSlideDirection('left');
    setCurrentDate((prev) =>
      viewMode === 'monthly' ? addMonths(prev, 1) : addWeeks(prev, 1),
    );
  }, [viewMode]);

  const prevPeriod = useCallback(() => {
    setSlideDirection('right');
    setCurrentDate((prev) =>
      viewMode === 'monthly' ? subMonths(prev, 1) : subWeeks(prev, 1),
    );
  }, [viewMode]);

  // 날짜 계산을 useMemo로 메모이제이션
  const days = useMemo(() => {
    if (viewMode === 'monthly') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart);
      const endDate = endOfWeek(monthEnd);
      const daysList = [];
      let day = startDate;
      while (day <= endDate) {
        daysList.push(day);
        day = addDays(day, 1);
      }
      return daysList;
    } else {
      const startDate = startOfWeek(currentDate);
      const daysList = [];
      for (let i = 0; i < 7; i++) {
        daysList.push(addDays(startDate, i));
      }
      return daysList;
    }
  }, [currentDate, viewMode]);

  const schedulesByDate = useMemo(() => {
    let filtered = optimisticSchedules;

    if (hideEnded) {
      filtered = filtered.filter((s) => !s.isLiveEnded);
    }

    if (selectedStreamers.size > 0) {
      filtered = filtered.filter((s) =>
        s.participants.some((p) => selectedStreamers.has(p.id)),
      );
    }

    if (selectedGames.size > 0) {
      filtered = filtered.filter(
        (s) => s.gameId != null && selectedGames.has(s.gameId),
      );
    }

    const map = new Map<string, FlattenedSchedule[]>();
    filtered.forEach((schedule) => {
      const st = new Date(schedule.startTime);
      if (!isValid(st)) return;
      const dateKey = format(st, 'yyyy-MM-dd');
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(schedule);
    });
    return map;
  }, [
    optimisticSchedules,
    selectedStreamers,
    selectedGames,
    hideEnded,
  ]);
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const handleDayClick = useCallback(
    (day: Date) => {
      const dateString = format(day, 'yyyy-MM-dd');
      router.push(`/calendar/day/${dateString}`, { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const [legacyUi] = useLegacyCalendarUi();
  const isV2Weekly = viewMode === 'weekly' && !legacyUi;
  const isLoggedIn = !!session;

  const handleOpenCreateModal = useCallback(() => {
    if (!isLoggedIn) {
      toast.error('로그인이 필요합니다.', {
        actionLabel: '로그인하기',
        onAction: () => router.push('/login'),
      });
      return;
    }
    setEditSchedule(undefined);
    setIsFormOpen(true);
  }, [isLoggedIn, toast, router]);

  const handleToggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === 'weekly' ? 'monthly' : 'weekly'));
    setIsMobileFabOpen(false);
  }, []);

  const handleGoToday = useCallback(() => {
    setCurrentDate(new Date());
    setIsMobileFabOpen(false);
  }, []);

  if (!mounted) {
    return <div className="flex-1 bg-slate-50/50 dark:bg-slate-950" />;
  }

  return (
    <div
      className={`flex flex-col sm:flex-1 sm:min-h-0 sm:overflow-hidden ${
        isV2Weekly ? 'px-1.5 py-3 md:px-2 md:py-4' : 'p-4 md:p-6'
      }`}
    >
      <CalendarWelcomeBanner />
      {/* 상단 컨트롤 영역 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center shrink-0 mb-4 gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto min-w-0">
          <div className="flex bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-1">
            <button
              onClick={prevPeriod}
              className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <button
              onClick={nextPeriod}
              className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none truncate">
              {format(currentDate, 'yyyy년 M월')}
            </h2>
            {viewMode === 'weekly' && (
              <p className="text-slate-400 dark:text-slate-500 font-bold text-[11px] mt-1 truncate">
                {format(startOfWeek(currentDate), 'M. d')} -{' '}
                {format(endOfWeek(currentDate), 'M. d')}
              </p>
            )}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 w-full md:w-auto md:justify-end flex-wrap md:flex-nowrap">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="h-8 px-3 rounded-lg text-sm font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors shrink-0"
          >
            오늘
          </button>
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
            <button
              onClick={() => setViewMode('weekly')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'weekly' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <LayoutGrid className="w-4 h-4" /> 주간
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'monthly' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <CalendarIcon className="w-4 h-4" /> 월간
            </button>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className={`h-8 flex-1 sm:flex-none sm:min-w-[96px] flex items-center justify-center gap-1.5 px-3 sm:px-4 rounded-lg font-bold transition-colors shadow-sm text-sm ${
              isLoggedIn
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-400/80 dark:hover:bg-slate-600'
            }`}
          >
            {isLoggedIn ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>일정 추가</span>
          </button>
        </div>
      </div>
      <FilterBar
        streamers={streamers}
        games={games}
        selectedStreamers={selectedStreamers}
        selectedGames={selectedGames}
        favoriteIds={favoriteIds}
        onStreamerToggle={handleStreamerToggle}
        onGameToggle={handleGameToggle}
        onToggleFavorite={toggleFavorite}
        onApplyFavorites={applyFavorites}
        onClearAll={() => {
          setSelectedStreamers(new Set());
          setSelectedGames(new Set());
        }}
      />
      {hideEnded && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl w-fit text-xs font-black text-amber-600 dark:text-amber-400 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 dark:bg-amber-500" />
          종료된 방송 숨김 중
        </div>
      )}
      {/* 캘린더 본체 */}
      <div
        className={`sm:flex-1 sm:overflow-hidden flex flex-col ${
          isV2Weekly
            ? 'rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-100/40 dark:bg-slate-900/60 shadow-sm'
            : 'bg-white dark:bg-slate-900 rounded-4xl shadow-sm border border-slate-100 dark:border-slate-800'
        }`}
      >
        {/* ── 모바일 주간 리스트 (sm 미만 + weekly) ── */}
        {viewMode === 'weekly' && (
          <div
            key={`mobile-${currentDate.toISOString()}`}
            className="sm:hidden animate-in fade-in duration-300 space-y-3 p-2"
          >
            {days.map((day) => {
              const today = isToday(day);
              const dateKey = format(day, 'yyyy-MM-dd');
              const daySchedules = schedulesByDate.get(dateKey) || [];
              const dayIdx = day.getDay();
              const dayNameColor =
                dayIdx === 0
                  ? 'text-red-500 dark:text-red-400'
                  : dayIdx === 6
                    ? 'text-blue-500 dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400';

              return (
                <section
                  key={format(day, 'yyyy-MM-dd')}
                  ref={today ? todayMobileRef : null}
                  className={`overflow-hidden rounded-2xl border ${
                    today
                      ? 'border-indigo-200/80 dark:border-indigo-800/60 bg-white dark:bg-slate-900 shadow-sm ring-1 ring-indigo-100/80 dark:ring-indigo-900/40'
                      : 'border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleDayClick(day)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                        today
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className={`text-sm font-black ${dayNameColor}`}>
                        {weekDays[dayIdx]}요일
                      </span>
                      {today && (
                        <span className="ml-2 text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                          오늘
                        </span>
                      )}
                    </div>
                    {daySchedules.length > 0 && (
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {daySchedules.length}
                      </span>
                    )}
                  </button>

                  {daySchedules.length > 0 ? (
                    <div className="space-y-2 border-t border-slate-100 px-3 py-3 dark:border-slate-800">
                      {daySchedules.map((schedule, i) =>
                        legacyUi ? (
                          <ScheduleCard
                            key={schedule.id}
                            schedule={schedule}
                            variant="mobile"
                            liveStreamerIds={liveStreamerIds}
                            index={i}
                          />
                        ) : (
                          <ScheduleCardV2
                            key={schedule.id}
                            schedule={schedule}
                            variant="mobile"
                            liveStreamerIds={liveStreamerIds}
                            index={i}
                          />
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="border-t border-slate-100 px-4 py-4 text-center text-xs font-semibold text-slate-400 dark:border-slate-800 dark:text-slate-500">
                      일정 없음
                    </p>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {/* ── 데스크탑 그리드 / 모바일 월간 그리드 ── */}
        <div
          className={`${viewMode === 'weekly' ? 'hidden sm:flex' : 'flex'} flex-col sm:flex-1 sm:overflow-hidden`}
        >
          {isV2Weekly ? (
            /* V2 weekly — 카드형 컬럼 레이아웃 */
            <motion.div
              key={`v2-${currentDate.toISOString()}`}
              {...calendarGridSlide(slideDirection)}
              className="flex-1 overflow-hidden p-0.5 sm:p-1"
            >
              <div className="grid h-full min-h-0 grid-cols-7 gap-1.5 sm:gap-2">
                {days.map((day, colIndex) => {
                  const today = isToday(day);
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const daySchedules = schedulesByDate.get(dateKey) || [];
                  const dayIdx = day.getDay();
                  const dayNameColor =
                    dayIdx === 0
                      ? 'text-red-400'
                      : dayIdx === 6
                        ? 'text-blue-500'
                        : 'text-slate-400 dark:text-slate-500';

                  return (
                    <motion.div
                      key={format(day, 'yyyy-MM-dd')}
                      custom={colIndex}
                      initial="hidden"
                      animate="visible"
                      variants={calendarColumnVariants}
                      onClick={() => handleDayClick(day)}
                      className={`group flex h-full min-h-0 cursor-pointer flex-col overflow-hidden rounded-2xl border transition-[box-shadow,border-color] duration-200 ${
                        today
                          ? 'border-indigo-300/70 bg-linear-to-b from-indigo-50/90 via-white to-white shadow-md shadow-indigo-500/10 ring-2 ring-indigo-400/30 dark:border-indigo-700/60 dark:from-indigo-950/50 dark:via-slate-900 dark:to-slate-900 dark:shadow-indigo-900/20 dark:ring-indigo-500/25'
                          : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-600'
                      }`}
                    >
                      <div
                        className={`shrink-0 border-b px-2 py-1.5 sm:px-2.5 sm:py-2 ${
                          today
                            ? 'border-indigo-100/80 bg-indigo-50/50 dark:border-indigo-900/50 dark:bg-indigo-950/30'
                            : 'border-slate-100 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="min-w-0">
                            <div className="mb-0.5 flex items-center gap-1.5">
                              <p
                                className={`text-[9px] font-black uppercase tracking-widest ${dayNameColor}`}
                              >
                                {weekDays[dayIdx]}
                              </p>
                              {today && (
                                <span className="rounded-md bg-indigo-600 px-1 py-px text-[8px] font-black uppercase tracking-wide text-white">
                                  오늘
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-lg font-black leading-none sm:text-xl ${
                                today
                                  ? 'text-indigo-600 dark:text-indigo-400'
                                  : 'text-slate-800 dark:text-slate-100'
                              }`}
                            >
                              {format(day, 'd')}
                            </p>
                          </div>
                          {daySchedules.length > 0 && (
                            <span
                              className={`inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-black ${
                                today
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              {daySchedules.length}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-1.5 custom-scrollbar sm:gap-2 sm:p-2">
                        {daySchedules.length > 0 ? (
                          daySchedules.map((schedule, i) => (
                            <ScheduleCardV2
                              key={schedule.id}
                              schedule={schedule}
                              variant="weekly"
                              liveStreamerIds={liveStreamerIds}
                              index={i}
                            />
                          ))
                        ) : (
                          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200/80 bg-slate-50/50 px-2 py-6 text-center dark:border-slate-700 dark:bg-slate-800/30">
                            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                              —
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            /* V1 — 기존 그리드 레이아웃 */
            <>
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/30 dark:bg-slate-800/60">
                {weekDays.map((day, idx) => (
                  <div
                    key={day}
                    className={`py-3 text-center text-[13px] font-black tracking-wide ${idx === 0 ? 'text-red-400' : idx === 6 ? 'text-blue-400' : 'text-slate-400'}`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              <motion.div
                key={`${currentDate.toISOString()}-${viewMode}`}
                {...calendarGridSlide(slideDirection)}
                className="sm:flex-1 overflow-y-auto custom-scrollbar pb-4 sm:pb-0"
              >
                <div
                  className="grid grid-cols-7 sm:h-full"
                  style={{
                    gridTemplateRows:
                      viewMode === 'monthly'
                        ? `repeat(${Math.max(1, Math.floor(days.length / 7))}, minmax(100px, 1fr))`
                        : `repeat(1, 1fr)`,
                  }}
                >
                  {days.map((day, idx) => {
                    const isSelectedMonth = isSameMonth(day, currentDate);
                    const today = isToday(day);
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const daySchedules = schedulesByDate.get(dateKey) || [];

                    return (
                      <div
                        key={format(day, 'yyyy-MM-dd')}
                        onClick={() => handleDayClick(day)}
                        className={`flex flex-col p-2 border-b border-r border-slate-100 dark:border-slate-800 group cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/80 transition-all duration-300 overflow-hidden ${!isSelectedMonth && viewMode === 'monthly' ? 'bg-slate-50/30 dark:bg-slate-950/60 opacity-50' : ''} ${idx % 7 === 6 ? 'border-r-0' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-1 shrink-0">
                          <span
                            className={`w-7 h-7 flex items-center justify-center text-[13px] font-bold rounded-full transition-colors duration-300 ${today ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}
                          >
                            {format(day, 'd')}
                          </span>
                        </div>

                        {/* 월간 모바일: 점 */}
                        {daySchedules.length > 0 && (
                          <div className="flex sm:hidden flex-col items-start gap-1 mt-0.5 shrink-0">
                            <div className="flex flex-wrap gap-0.5">
                              {daySchedules.slice(0, 3).map((schedule) => (
                                <div
                                  key={schedule.id}
                                  className={`w-1.5 h-1.5 rounded-full ${schedule.game ? 'bg-amber-400' : 'bg-slate-400 dark:bg-slate-500'}`}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">
                              {daySchedules.length}개
                            </span>
                          </div>
                        )}

                        {/* 데스크탑: 텍스트 카드 */}
                        <div className="hidden sm:flex flex-col flex-1 min-h-0 gap-1 overflow-y-auto custom-scrollbar">
                          {daySchedules.map((schedule, i) =>
                            legacyUi ? (
                              <ScheduleCard
                                key={schedule.id}
                                schedule={schedule}
                                variant={viewMode}
                                liveStreamerIds={liveStreamerIds}
                                index={i}
                              />
                            ) : (
                              <ScheduleCardV2
                                key={schedule.id}
                                schedule={schedule}
                                variant="monthly"
                                liveStreamerIds={liveStreamerIds}
                                index={i}
                              />
                            ),
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>{' '}
      {/* 캘린더 본체 */}
      <AnimatePresence>
        {isFormOpen && (
          <ScheduleFormModal
            streamers={streamers}
            games={games}
            initialData={editSchedule}
            onOptimisticCreate={(schedule) => {
              startTransition(() => {
                addOptimisticSchedule(schedule);
              });
            }}
            onClose={() => {
              setIsFormOpen(false);
              setEditSchedule(undefined);
              router.refresh();
            }}
          />
        )}
      </AnimatePresence>

      {/* 모바일 플로팅 액션 메뉴 */}
      <AnimatePresence>
        {isMobileFabOpen && (
          <div className="md:hidden fixed inset-0 z-40" onClick={() => setIsMobileFabOpen(false)}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/25 backdrop-blur-[1px]"
            />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.16 }}
              className="absolute bottom-24 right-4 w-52 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-xl p-2"
              onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
            >
              <button
                onClick={handleGoToday}
                className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                오늘로 이동
              </button>
              <button
                onClick={handleToggleViewMode}
                className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                보기 전환 ({viewMode === 'weekly' ? '월간' : '주간'})
              </button>
              <button
                onClick={() => {
                  setIsMobileFabOpen(false);
                  handleOpenCreateModal();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
              >
                일정 추가
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setIsMobileFabOpen((prev) => !prev)}
        className="md:hidden fixed bottom-24 right-4 z-50 w-12 h-12 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center"
        aria-label="빠른 메뉴 열기"
      >
        {isMobileFabOpen ? <X className="w-5 h-5" /> : <Clock3 className="w-5 h-5" />}
      </button>
    </div>
  );
}
