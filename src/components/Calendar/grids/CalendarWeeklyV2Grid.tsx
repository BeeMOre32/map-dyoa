'use client';

import { format, isToday } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import ScheduleCardV2 from '@/components/Calendar/ScheduleCardV2';
import CalendarEmptyDay from '@/components/Calendar/CalendarEmptyDay';
import CalendarLiveColumnBadge from '@/components/Calendar/atoms/CalendarLiveColumnBadge';
import {
  getWeekdayNameColor,
  WEEKDAY_LABELS,
  type CalendarSlideDirection,
} from '@/lib/calendar/calendarViewUtils';
import {
  calendarColumnVariants,
  calendarGridPresenceVariants,
} from '@/lib/calendarMotion';
import { isScheduleLiveOnCard } from '@/lib/schedule-live';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';

interface CalendarWeeklyV2GridProps {
  days: Date[];
  schedulesByDate: Map<string, FlattenedSchedule[]>;
  slideDirection: CalendarSlideDirection;
  currentDate: Date;
  liveStreamerIds: Set<string>;
  isLoggedIn: boolean;
  onDayClick: (day: Date) => void;
  onOpenCreateModal: () => void;
}

export default function CalendarWeeklyV2Grid({
  days,
  schedulesByDate,
  slideDirection,
  currentDate,
  liveStreamerIds,
  isLoggedIn,
  onDayClick,
  onOpenCreateModal,
}: CalendarWeeklyV2GridProps) {
  return (
    <AnimatePresence mode="wait" custom={slideDirection}>
      <motion.div
        key={`v2-${currentDate.toISOString()}`}
        custom={slideDirection}
        variants={calendarGridPresenceVariants}
        initial="enter"
        animate="center"
        exit="exit"
        style={{ display: 'flex', flexDirection: 'column' }}
        className="flex-1 overflow-hidden p-0.5 sm:p-1"
      >
        <div className="grid h-full min-h-0 grid-cols-7 gap-1.5 sm:gap-2">
          {days.map((day, colIndex) => {
            const today = isToday(day);
            const dateKey = format(day, 'yyyy-MM-dd');
            const daySchedules = schedulesByDate.get(dateKey) ?? [];
            const dayIdx = day.getDay();
            const liveCount = daySchedules.filter((s) =>
              isScheduleLiveOnCard(s, liveStreamerIds),
            ).length;

            return (
              <motion.div
                key={dateKey}
                custom={colIndex}
                initial="hidden"
                animate="visible"
                variants={calendarColumnVariants}
                onClick={() => onDayClick(day)}
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
                          className={`text-[9px] font-black uppercase tracking-widest ${getWeekdayNameColor(dayIdx, 'desktop')}`}
                        >
                          {WEEKDAY_LABELS[dayIdx]}
                        </p>
                        {today ? (
                          <span className="rounded-md bg-indigo-600 px-1 py-px text-[8px] font-black uppercase tracking-wide text-white">
                            오늘
                          </span>
                        ) : null}
                        {liveCount > 0 ? <CalendarLiveColumnBadge /> : null}
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
                    {daySchedules.length > 0 ? (
                      <span
                        className={`inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-black ${
                          today
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {daySchedules.length}
                      </span>
                    ) : null}
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
                    <CalendarEmptyDay
                      compact
                      isLoggedIn={isLoggedIn}
                      onAdd={onOpenCreateModal}
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
