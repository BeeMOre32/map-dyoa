'use client';

import { Plus } from 'lucide-react';

interface CalendarEmptyDayProps {
  compact?: boolean;
  isLoggedIn: boolean;
  onAdd?: () => void;
}

export default function CalendarEmptyDay({
  compact = false,
  isLoggedIn,
  onAdd,
}: CalendarEmptyDayProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact
          ? 'flex-1 rounded-xl border border-dashed border-slate-200/80 bg-slate-50/50 px-2 py-4 dark:border-slate-700 dark:bg-slate-800/30'
          : 'border-t border-slate-100 px-4 py-4 dark:border-slate-800'
      }`}
    >
      <p
        className={`font-semibold text-slate-400 dark:text-slate-500 ${
          compact ? 'text-[11px]' : 'text-xs'
        }`}
      >
        이날 등록된 합방 없음
      </p>
      {isLoggedIn && onAdd ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          className={`mt-2 inline-flex items-center gap-1 rounded-lg font-black text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 ${
            compact ? 'text-[10px]' : 'text-xs'
          }`}
        >
          <Plus className="h-3.5 w-3.5" />
          일정 추가
        </button>
      ) : null}
    </div>
  );
}
