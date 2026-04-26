// src/components/calendar/CalendarView.tsx
'use client';

import { useState, useEffect, useMemo, useCallback, useOptimistic, useTransition, useRef } from 'react';
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
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  LayoutGrid,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';

import ScheduleFormModal from '@/components/Form/CreateScheduleModal';
import ScheduleCard from '@/components/Calendar/ScheduleCard';
import FilterBar from '@/components/Calendar/FilterBar';

import type { Streamer, Game } from '@prisma/client';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';

interface CalendarViewProps {
  initialSchedules: FlattenedSchedule[];
  streamers: Streamer[];
  games: Game[];
}

export default function CalendarView({
  initialSchedules,
  streamers,
  games,
}: CalendarViewProps) {
  const router = useRouter();
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
  const [selectedStreamers, setSelectedStreamers] = useState<Set<string>>(new Set());
  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set());
  const [liveStreamerIds, setLiveStreamerIds] = useState<Set<string>>(new Set());
  const todayMobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await fetch('/api/chzzk/live-status');
        const data = await res.json();
        setLiveStreamerIds(new Set(data.liveStreamerIds));
      } catch {}
    };
    fetchLive();
    const interval = setInterval(fetchLive, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (viewMode === 'weekly' && todayMobileRef.current) {
      todayMobileRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

    if (selectedStreamers.size > 0) {
      filtered = filtered.filter((s) =>
        s.participants.some((p) => selectedStreamers.has(p.id)),
      );
    }

    if (selectedGames.size > 0) {
      filtered = filtered.filter((s) =>
        s.gameId != null && selectedGames.has(s.gameId),
      );
    }

    const map = new Map<string, FlattenedSchedule[]>();
    filtered.forEach((schedule) => {
      const dateKey = format(new Date(schedule.startTime), 'yyyy-MM-dd');
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(schedule);
    });
    return map;
  }, [optimisticSchedules, selectedStreamers, selectedGames]);
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

  if (!mounted) {
    return <div className="flex-1 bg-slate-50/50 dark:bg-slate-950" />;
  }

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden h-full max-h-[calc(100vh-100px)]">
      {/* 상단 컨트롤 영역 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center shrink-0 mb-4">
        <div className="flex items-center gap-3">
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
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none">
              {format(currentDate, 'yyyy년 M월')}
            </h2>
            {viewMode === 'weekly' && (
              <p className="text-slate-400 dark:text-slate-500 font-bold text-xs mt-1">
                {format(startOfWeek(currentDate), 'M. d')} -{' '}
                {format(endOfWeek(currentDate), 'M. d')}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 mt-3 md:mt-0">
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode('weekly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'weekly' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <LayoutGrid className="w-4 h-4" /> 주간
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'monthly' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <CalendarIcon className="w-4 h-4" /> 월간
            </button>
          </div>
          <button
            onClick={() => {
              setEditSchedule(undefined);
              setIsFormOpen(true);
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">일정 추가</span>
          </button>
        </div>
      </div>

      <FilterBar
        streamers={streamers}
        games={games}
        selectedStreamers={selectedStreamers}
        selectedGames={selectedGames}
        onStreamerToggle={handleStreamerToggle}
        onGameToggle={handleGameToggle}
        onClearAll={() => { setSelectedStreamers(new Set()); setSelectedGames(new Set()); }}
      />

      {/* 캘린더 본체 */}
      <div className="flex-1 overflow-hidden bg-white dark:bg-slate-900 rounded-4xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">

        {/* ── 모바일 주간 리스트 (sm 미만 + weekly) ── */}
        {viewMode === 'weekly' && (
          <div
            key={`mobile-${currentDate.toISOString()}`}
            className="sm:hidden flex-1 overflow-y-auto custom-scrollbar animate-in fade-in duration-300"
          >
            {days.map((day) => {
              const today = isToday(day);
              const dateKey = format(day, 'yyyy-MM-dd');
              const daySchedules = schedulesByDate.get(dateKey) || [];
              const dayIdx = day.getDay();
              const dayNameColor = dayIdx === 0 ? 'text-red-400' : dayIdx === 6 ? 'text-blue-400' : 'text-slate-400 dark:text-slate-500';

              return (
                <div key={day.toString()} ref={today ? todayMobileRef : null} className="border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                  {/* 날짜 행 */}
                  <div
                    onClick={() => handleDayClick(day)}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-black shrink-0 ${today ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-700 dark:text-slate-200'}`}>
                      {format(day, 'd')}
                    </span>
                    <span className={`text-sm font-black ${dayNameColor}`}>
                      {weekDays[dayIdx]}요일
                    </span>
                    {daySchedules.length > 0 && (
                      <span className="ml-auto text-[11px] font-black text-slate-300 dark:text-slate-600">
                        {daySchedules.length}개
                      </span>
                    )}
                  </div>

                  {/* 일정 목록 */}
                  {daySchedules.length > 0 && (
                    <div className="px-4 pb-3 space-y-1.5">
                      {daySchedules.map((schedule) => (
                        <ScheduleCard key={schedule.id} schedule={schedule} variant="mobile" liveStreamerIds={liveStreamerIds} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── 데스크탑 그리드 / 모바일 월간 그리드 ── */}
        <div className={`${viewMode === 'weekly' ? 'hidden sm:flex' : 'flex'} flex-col flex-1 overflow-hidden`}>
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

          <div
            key={`${currentDate.toISOString()}-${viewMode}`}
            className={`flex-1 overflow-y-auto custom-scrollbar animate-in fade-in duration-500 ease-out fill-mode-forwards ${slideDirection === 'left' ? 'slide-in-from-right-10' : 'slide-in-from-left-10'}`}
          >
            <div
              className="grid grid-cols-7 h-full"
              style={{
                gridTemplateRows:
                  viewMode === 'monthly'
                    ? `repeat(${days.length / 7}, minmax(100px, 1fr))`
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
                    key={day.toString()}
                    onClick={() => handleDayClick(day)}
                    className={`p-2 border-b border-r border-slate-100 dark:border-slate-800 relative group cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/80 transition-all duration-300 overflow-hidden ${!isSelectedMonth && viewMode === 'monthly' ? 'bg-slate-50/30 dark:bg-slate-950/60 opacity-50' : ''} ${idx % 7 === 6 ? 'border-r-0' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span
                        className={`w-7 h-7 flex items-center justify-center text-[13px] font-bold rounded-full transition-colors duration-300 ${today ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>

                    {/* 월간 모바일: 점 */}
                    {daySchedules.length > 0 && (
                      <div className="flex sm:hidden flex-col items-start gap-1 mt-0.5">
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
                    <div className="hidden sm:flex flex-col gap-1.5 overflow-y-auto max-h-[calc(100%-35px)] custom-scrollbar">
                      {daySchedules.map((schedule) => (
                        <ScheduleCard key={schedule.id} schedule={schedule} variant={viewMode} liveStreamerIds={liveStreamerIds} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div> {/* 캘린더 본체 */}

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
    </div>
  );
}
