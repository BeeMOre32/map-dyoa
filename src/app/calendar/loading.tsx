import { CalendarPageSkeleton } from '@/components/Calendar/ScheduleModalSkeleton';

export default function CalendarLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-50/50 dark:bg-slate-950">
      <CalendarPageSkeleton />
    </div>
  );
}
