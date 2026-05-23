'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import Link from 'next/link';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';
import ScheduleCardV2 from '@/components/Calendar/ScheduleCardV2';
import { useLegacyCalendarUi } from '@/hooks/useLegacyCalendarUi';
import ScheduleCard from '@/components/Calendar/ScheduleCard';
import CalendarEmptyDay from '@/components/Calendar/CalendarEmptyDay';

interface CalendarMobileDaySheetProps {
  day: Date | null;
  schedules: FlattenedSchedule[];
  liveStreamerIds: Set<string>;
  isLoggedIn: boolean;
  onClose: () => void;
  onAdd: () => void;
  onOpenDay: (day: Date) => void;
}

export default function CalendarMobileDaySheet({
  day,
  schedules,
  liveStreamerIds,
  isLoggedIn,
  onClose,
  onAdd,
  onOpenDay,
}: CalendarMobileDaySheetProps) {
  const [legacyUi] = useLegacyCalendarUi();

  return (
    <AnimatePresence>
      {day ? (
        <div className="fixed inset-0 z-50 sm:hidden">
          <motion.button
            type="button"
            aria-label="닫기"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/35 backdrop-blur-[1px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            className="absolute inset-x-0 bottom-0 max-h-[min(72vh,520px)] overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <div>
                <p className="text-base font-black text-slate-900 dark:text-white">
                  {format(day, 'M월 d일 (EEE)', { locale: ko })}
                </p>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                  {schedules.length}개 일정
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-3 py-3 custom-scrollbar">
              {schedules.length > 0 ? (
                <div className="space-y-2">
                  {schedules.map((schedule, i) =>
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
                <CalendarEmptyDay isLoggedIn={isLoggedIn} onAdd={onAdd} />
              )}
            </div>
            <div className="border-t border-slate-100 px-3 py-3 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onOpenDay(day)}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-black text-white"
              >
                날짜 상세 보기
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
