'use client';

import { AnimatePresence, motion } from 'motion/react';
import { statsMonthLabelVariants } from '@/lib/statsMotion';
import type {
  CalendarSlideDirection,
  CalendarViewMode,
} from '@/lib/calendar/calendarViewUtils';

interface CalendarPeriodHeaderProps {
  viewMode: CalendarViewMode;
  slideDirection: CalendarSlideDirection;
  weekRangeKey: string;
  weekRangeLabel: string;
  weekYearLabel: string | null;
  monthHeaderKey: string;
  monthTitle: string;
}

export default function CalendarPeriodHeader({
  viewMode,
  slideDirection,
  weekRangeKey,
  weekRangeLabel,
  weekYearLabel,
  monthHeaderKey,
  monthTitle,
}: CalendarPeriodHeaderProps) {
  return (
    <div className="min-w-0 overflow-hidden">
      <AnimatePresence mode="wait" initial={false} custom={slideDirection}>
        {viewMode === 'weekly' ? (
          <motion.div
            key={weekRangeKey}
            custom={slideDirection}
            variants={statsMonthLabelVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="min-w-0"
          >
            <h2 className="truncate text-lg font-black leading-none tracking-tight text-slate-800 dark:text-white sm:text-xl md:text-2xl">
              {weekRangeLabel}
            </h2>
            {weekYearLabel ? (
              <p className="mt-1 truncate text-[11px] font-bold text-slate-400 dark:text-slate-500">
                {weekYearLabel}
              </p>
            ) : null}
          </motion.div>
        ) : (
          <motion.div
            key={monthHeaderKey}
            custom={slideDirection}
            variants={statsMonthLabelVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="min-w-0"
          >
            <h2 className="truncate text-lg font-black leading-none tracking-tight text-slate-800 dark:text-white sm:text-xl md:text-2xl">
              {monthTitle}
            </h2>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
