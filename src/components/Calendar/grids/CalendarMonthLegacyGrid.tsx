'use client';

import { format, isSameMonth, isToday } from 'date-fns';
import { AnimatePresence, motion } from 'motion/react';
import ScheduleCard from '@/components/Calendar/ScheduleCard';
import ScheduleCardV2 from '@/components/Calendar/ScheduleCardV2';
import {
  WEEKDAY_LABELS,
  type CalendarSlideDirection,
  type CalendarViewMode,
} from '@/lib/calendar/calendarViewUtils';
import { calendarGridPresenceVariants } from '@/lib/calendarMotion';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';

interface CalendarMonthLegacyGridProps {
  days: Date[];
  schedulesByDate: Map<string, FlattenedSchedule[]>;
  slideDirection: CalendarSlideDirection;
  currentDate: Date;
  viewMode: CalendarViewMode;
  legacyUi: boolean;
  liveStreamerIds: Set<string>;
  onCellClick: (day: Date) => void;
}

export default function CalendarMonthLegacyGrid({
  days,
  schedulesByDate,
  slideDirection,
  currentDate,
  viewMode,
  legacyUi,
  liveStreamerIds,
  onCellClick,
}: CalendarMonthLegacyGridProps) {
  return (
    <>
      <div className="grid shrink-0 grid-cols-7 border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/80">
        {WEEKDAY_LABELS.map((day, idx) => (
          <div
            key={day}
            className={`py-3 text-center text-[13px] font-black tracking-wide ${
              idx === 0
                ? 'text-red-400'
                : idx === 6
                  ? 'text-blue-400'
                  : 'text-slate-400'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait" custom={slideDirection}>
        <motion.div
          key={`${currentDate.toISOString()}-${viewMode}`}
          custom={slideDirection}
          variants={calendarGridPresenceVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="custom-scrollbar overflow-y-auto pb-4 sm:flex-1 sm:pb-0"
        >
          <div
            className="grid grid-cols-7 sm:h-full"
            style={{
              gridTemplateRows:
                viewMode === 'monthly'
                  ? `repeat(${Math.max(1, Math.floor(days.length / 7))}, minmax(100px, 1fr))`
                  : 'repeat(1, 1fr)',
            }}
          >
            {days.map((day, idx) => {
              const isSelectedMonth = isSameMonth(day, currentDate);
              const today = isToday(day);
              const dateKey = format(day, 'yyyy-MM-dd');
              const daySchedules = schedulesByDate.get(dateKey) ?? [];

              return (
                <div
                  key={dateKey}
                  onClick={() => onCellClick(day)}
                  className={`group flex cursor-pointer flex-col overflow-hidden border-b border-r border-slate-100 p-2 transition-all duration-300 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/80 ${
                    !isSelectedMonth && viewMode === 'monthly'
                      ? 'bg-slate-50/30 opacity-50 dark:bg-slate-950/60'
                      : ''
                  } ${idx % 7 === 6 ? 'border-r-0' : ''}`}
                >
                  <div className="mb-1 flex shrink-0 items-start justify-between">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold transition-colors duration-300 ${
                        today
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-600 group-hover:text-indigo-600 dark:text-slate-300 dark:group-hover:text-indigo-400'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  {daySchedules.length > 0 ? (
                    <div className="mt-auto flex min-w-0 shrink-0 flex-col gap-0.5 sm:hidden">
                      <span className="truncate text-[9px] font-bold leading-tight text-slate-700 dark:text-slate-200">
                        {daySchedules[0].title}
                      </span>
                      {daySchedules.length > 1 ? (
                        <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400">
                          +{daySchedules.length - 1}
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="hidden min-h-0 flex-1 flex-col gap-1 overflow-y-auto custom-scrollbar sm:flex">
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
      </AnimatePresence>
    </>
  );
}
