// src/components/calendar/CalendarView.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
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
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';

import ScheduleFormModal from '@/components/Form/CreateScheduleModal';

import type { Streamer, Game } from '@prisma/client';
import type { FlattenedSchedule } from '../MainTabController';

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

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState<
    FlattenedSchedule | undefined
  >(undefined);
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>(
    'left',
  );

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
    const map = new Map<string, FlattenedSchedule[]>();
    initialSchedules.forEach((schedule) => {
      const dateKey = format(new Date(schedule.startTime), 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(schedule);
    });
    return map;
  }, [initialSchedules]);
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

      {/* 캘린더 본체 */}
      <div className="flex-1 overflow-hidden bg-white dark:bg-slate-900 rounded-4xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
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
          className={`flex-1 overflow-hidden animate-in fade-in duration-500 ease-out fill-mode-forwards ${slideDirection === 'left' ? 'slide-in-from-right-10' : 'slide-in-from-left-10'}`}
        >
          <div
            className="grid grid-cols-7 h-full"
            style={{
              gridTemplateRows:
                viewMode === 'monthly'
                  ? `repeat(${days.length / 7}, 1fr)`
                  : '1fr',
            }}
          >
            {days.map((day, idx) => {
              const isSelectedMonth = isSameMonth(day, currentDate);
              const today = isToday(day);
              // 메모이제이션된 맵에서 일정 조회
              const dateKey = format(day, 'yyyy-MM-dd');
              const daySchedules = schedulesByDate.get(dateKey) || [];

              return (
                <div
                  key={day.toString()}
                  // 🌟 수정: 클릭 시 handleDayClick 실행
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

                  <div className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100%-35px)] custom-scrollbar">
                    {daySchedules.map((schedule) => (
                      <Link
                        key={schedule.id}
                        href={`/calendar/schedule/${schedule.id}`} // 🌟 주소 체계에 맞춰 수정
                        scroll={false}
                        className="block"
                        // 🌟 중요: 개별 일정 클릭 시 '날짜 칸 클릭 이벤트'가 터지지 않게 방지
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          className={`px-2 py-1 text-[11px] font-bold rounded-md truncate border shadow-sm shrink-0 ${schedule.game ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-600'}`}
                        >
                          <span className="opacity-70 mr-1 font-semibold">
                            {format(new Date(schedule.startTime), 'HH:mm')}
                          </span>
                          {schedule.title}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <ScheduleFormModal
            streamers={streamers}
            games={games}
            initialData={editSchedule}
            onClose={() => {
              setIsFormOpen(false);
              setEditSchedule(undefined);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
