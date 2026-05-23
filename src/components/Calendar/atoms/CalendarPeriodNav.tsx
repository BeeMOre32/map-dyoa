import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarPeriodNavProps {
  onPrev: () => void;
  onNext: () => void;
}

export default function CalendarPeriodNav({
  onPrev,
  onNext,
}: CalendarPeriodNavProps) {
  return (
    <div className="flex rounded-xl border border-slate-100 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <button
        type="button"
        onClick={onPrev}
        className="rounded-xl p-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
        aria-label="이전"
      >
        <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
      </button>
      <button
        type="button"
        onClick={onNext}
        className="rounded-xl p-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
        aria-label="다음"
      >
        <ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-400" />
      </button>
    </div>
  );
}
