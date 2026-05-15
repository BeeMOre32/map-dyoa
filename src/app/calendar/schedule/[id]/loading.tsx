import {
  CalendarPageSkeleton,
  ScheduleDetailModalSkeleton,
} from '@/components/Calendar/ScheduleModalSkeleton';

export default function SchedulePageLoading() {
  return (
    <div className="relative min-h-screen w-full bg-slate-50/50 dark:bg-slate-950">
      <CalendarPageSkeleton />
      <ScheduleDetailModalSkeleton />
    </div>
  );
}
