import {
  Calendar as CalendarIcon,
  LayoutGrid,
  Lock,
  Plus,
} from 'lucide-react';
import type { CalendarViewMode } from '@/lib/calendar/calendarViewUtils';

interface CalendarDesktopToolbarProps {
  viewMode: CalendarViewMode;
  isLoggedIn: boolean;
  onGoToday: () => void;
  onSetViewMode: (mode: CalendarViewMode) => void;
  onOpenCreateModal: () => void;
}

export default function CalendarDesktopToolbar({
  viewMode,
  isLoggedIn,
  onGoToday,
  onSetViewMode,
  onOpenCreateModal,
}: CalendarDesktopToolbarProps) {
  return (
    <div className="hidden w-full flex-wrap items-center gap-2 md:flex md:w-auto md:flex-nowrap md:justify-end">
      <button
        type="button"
        onClick={onGoToday}
        className="h-8 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-500 transition-colors hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
      >
        오늘
      </button>
      <div className="flex shrink-0 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => onSetViewMode('weekly')}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-bold transition-all sm:px-3 ${
            viewMode === 'weekly'
              ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400'
              : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
          }`}
        >
          <LayoutGrid className="h-4 w-4" /> 주간
        </button>
        <button
          type="button"
          onClick={() => onSetViewMode('monthly')}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-bold transition-all sm:px-3 ${
            viewMode === 'monthly'
              ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400'
              : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
          }`}
        >
          <CalendarIcon className="h-4 w-4" /> 월간
        </button>
      </div>
      <button
        type="button"
        onClick={onOpenCreateModal}
        className={`flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-bold shadow-sm transition-colors sm:min-w-[96px] sm:flex-none sm:px-4 ${
          isLoggedIn
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-slate-300 text-slate-600 hover:bg-slate-400/80 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
        }`}
      >
        {isLoggedIn ? <Plus className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        <span>일정 추가</span>
      </button>
    </div>
  );
}
