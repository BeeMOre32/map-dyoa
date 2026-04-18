// src/components/calendar/CalendarView.tsx
'use client';

import { useState, useEffect } from 'react';
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

import ScheduleFormModal from '@/src/components/Form/CreateScheduleModal';

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

  const nextPeriod = () => {
    setSlideDirection('left');
    setCurrentDate(
      viewMode === 'monthly'
        ? addMonths(currentDate, 1)
        : addWeeks(currentDate, 1),
    );
  };
  const prevPeriod = () => {
    setSlideDirection('right');
    setCurrentDate(
      viewMode === 'monthly'
        ? subMonths(currentDate, 1)
        : subWeeks(currentDate, 1),
    );
  };

  const getDaysToRender = () => {
    if (viewMode === 'monthly') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart);
      const endDate = endOfWeek(monthEnd);
      const days = [];
      let day = startDate;
      while (day <= endDate) {
        days.push(day);
        day = addDays(day, 1);
      }
      return days;
    } else {
      const startDate = startOfWeek(currentDate);
      const days = [];
      for (let i = 0; i < 7; i++) {
        days.push(addDays(startDate, i));
      }
      return days;
    }
  };

  const days = getDaysToRender();
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  // 🌟 날짜 칸 클릭 시 해당 날짜 주소로 이동하는 함수
  const handleDayClick = (day: Date) => {
    const dateString = format(day, 'yyyy-MM-dd');
    router.push(`/calendar/day/${dateString}`, { scroll: false });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="flex-1 bg-slate-50/50" />;
  }

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden h-full max-h-[calc(100vh-100px)]">
      {/* 상단 컨트롤 영역 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center shrink-0 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-xl shadow-sm border border-slate-100 p-1">
            <button
              onClick={prevPeriod}
              className="p-1.5 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <button
              onClick={nextPeriod}
              className="p-1.5 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-none">
              {format(currentDate, 'yyyy년 M월')}
            </h2>
            {viewMode === 'weekly' && (
              <p className="text-slate-400 font-bold text-xs mt-1">
                {format(startOfWeek(currentDate), 'M. d')} -{' '}
                {format(endOfWeek(currentDate), 'M. d')}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 mt-3 md:mt-0">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('weekly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'weekly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid className="w-4 h-4" /> 주간
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'monthly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
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
      <div className="flex-1 overflow-hidden bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
        <div className="grid grid-cols-7 border-b border-slate-50 shrink-0 bg-slate-50/30">
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
              const daySchedules = initialSchedules.filter((s) =>
                isSameDay(new Date(s.startTime), day),
              );

              return (
                <div
                  key={day.toString()}
                  // 🌟 수정: 클릭 시 handleDayClick 실행
                  onClick={() => handleDayClick(day)}
                  className={`p-2 border-b border-r border-slate-50 relative group cursor-pointer hover:bg-slate-50/50 transition-all duration-300 overflow-hidden ${!isSelectedMonth && viewMode === 'monthly' ? 'bg-slate-50/30 opacity-50' : ''} ${idx % 7 === 6 ? 'border-r-0' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className={`w-7 h-7 flex items-center justify-center text-[13px] font-bold rounded-full transition-colors duration-300 ${today ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 group-hover:text-indigo-600'}`}
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
                          className="px-2 py-1 text-[11px] font-bold rounded-md truncate border shadow-sm shrink-0"
                          style={{
                            backgroundColor: schedule.game
                              ? '#fffbeb'
                              : '#f8fafc',
                            color: schedule.game ? '#d97706' : '#475569',
                            borderColor: schedule.game ? '#fde68a' : '#e2e8f0',
                          }}
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
