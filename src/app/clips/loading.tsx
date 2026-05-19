import { Clapperboard } from 'lucide-react';
import CalendarShimmerBar from '@/components/Calendar/CalendarShimmerBar';
import { ClipSkeletonCard } from '@/components/clips/ClipSkeleton';

export default function ClipsLoading() {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 transition-colors dark:bg-slate-950">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900 sm:rounded-3xl sm:shadow-xl">
        <div className="shrink-0 space-y-4 border-b border-slate-50 bg-slate-50/30 p-4 dark:border-slate-700 dark:bg-slate-800/20 sm:p-6">
          <div className="flex items-center gap-2">
            <Clapperboard className="h-5 w-5 text-indigo-500" />
            <CalendarShimmerBar className="h-6 w-24 rounded-full" />
          </div>
          <CalendarShimmerBar className="h-10 w-full rounded-xl" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <ClipSkeletonCard key={i} index={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
