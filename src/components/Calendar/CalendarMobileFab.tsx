'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Clock3, X } from 'lucide-react';
import type { CalendarViewMode } from '@/lib/calendar/calendarViewUtils';

interface CalendarMobileFabProps {
  isOpen: boolean;
  viewMode: CalendarViewMode;
  onToggle: () => void;
  onClose: () => void;
  onGoToday: () => void;
  onToggleViewMode: () => void;
  onOpenCreateModal: () => void;
}

export default function CalendarMobileFab({
  isOpen,
  viewMode,
  onToggle,
  onClose,
  onGoToday,
  onToggleViewMode,
  onOpenCreateModal,
}: CalendarMobileFabProps) {
  return (
    <>
      <AnimatePresence>
        {isOpen ? (
          <div className="fixed inset-0 z-40 md:hidden" onClick={onClose}>
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
              className="absolute bottom-24 right-4 w-52 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={onGoToday}
                className="w-full rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                오늘로 이동
              </button>
              <button
                type="button"
                onClick={onToggleViewMode}
                className="w-full rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                보기 전환 ({viewMode === 'weekly' ? '월간' : '주간'})
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCreateModal();
                }}
                className="w-full rounded-xl px-3 py-2 text-left text-sm font-bold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
              >
                일정 추가
              </button>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={onToggle}
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] right-3 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg sm:right-4 sm:h-12 sm:w-12 md:hidden"
        aria-label="빠른 메뉴 열기"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
      </button>
    </>
  );
}
