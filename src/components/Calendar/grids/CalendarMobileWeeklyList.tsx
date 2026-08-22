'use client';

import type { RefObject } from 'react';
import { format, isToday } from 'date-fns';
import { AnimatePresence, motion } from 'motion/react';
import ScheduleCard from '@/components/Calendar/ScheduleCard';
import ScheduleCardV2 from '@/components/Calendar/ScheduleCardV2';
import CalendarEmptyDay from '@/components/Calendar/CalendarEmptyDay';
import {
  getWeekdayNameColor,
  WEEKDAY_LABELS,
  type CalendarSlideDirection,
} from '@/lib/calendar/calendarViewUtils';
import { calendarGridPresenceVariants } from '@/lib/calendarMotion';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';

interface CalendarMobileWeeklyListProps {
  days: Date[];
  schedulesByDate: Map<string, FlattenedSchedule[]>;
  slideDirection: CalendarSlideDirection;
  currentDate: Date;
  legacyUi: boolean;
  liveStreamerIds: Set<string>;
  isLoggedIn: boolean;
  todayMobileRef: RefObject<HTMLDivElement | null>;
  onDayClick: (day: Date) => void;
  onOpenCreateModal: () => void;
}

export default function CalendarMobileWeeklyList({
  days,
  schedulesByDate,
  slideDirection,
  currentDate,
  legacyUi,
  liveStreamerIds,
  isLoggedIn,
  todayMobileRef,
  onDayClick,
  onOpenCreateModal,
}: CalendarMobileWeeklyListProps) {
  return (
    <AnimatePresence mode="wait" custom={slideDirection}>
      <motion.div
        key={`mobile-${currentDate.toISOString()}`}
        custom={slideDirection}
        variants={calendarGridPresenceVariants}
        initial="enter"
        animate="center"
        exit="exit"
        className="flex flex-col space-y-3 p-2 sm:hidden"
      >
        {days.map((day) => {
          const today = isToday(day);
          const dateKey = format(day, 'yyyy-MM-dd');
          const daySchedules = schedulesByDate.get(dateKey) ?? [];
          const dayIdx = day.getDay();

          return (
            <section
              key={dateKey}
              ref={today ? todayMobileRef : null}
              className={`overflow-hidden rounded-2xl border ${
                today
                  ? 'border-indigo-200/80 bg-white shadow-sm ring-1 ring-indigo-100/80 dark:border-indigo-800/60 dark:bg-slate-900 dark:ring-indigo-900/40'
                  : 'border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-900/80'
              }`}
            >
              <button
                type="button"
                onClick={() => onDayClick(day)}
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
                  <span
                    className={`text-sm font-black ${getWeekdayNameColor(dayIdx, 'mobile')}`}
                  >
                    {WEEKDAY_LABELS[dayIdx]}요일
                  </span>
                  {today ? (
                    <span className="ml-2 text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                      오늘
                    </span>
                  ) : null}
                </div>
                {daySchedules.length > 0 ? (
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {daySchedules.length}
                  </span>
                ) : null}
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
                <CalendarEmptyDay
                  isLoggedIn={isLoggedIn}
                  onAdd={onOpenCreateModal}
                />
              )}
            </section>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}
