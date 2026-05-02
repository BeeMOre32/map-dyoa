import { Clapperboard } from 'lucide-react';
import { ClipSkeletonCard } from '@/components/clips/ClipSkeleton';

export default function ClipsLoading() {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950 transition-colors">
      <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* 헤더 스켈레톤 */}
        <div className="p-6 border-b border-slate-50 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20 shrink-0 space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clapperboard className="w-5 h-5 text-indigo-500" />
                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
              </div>
              <div className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="h-9 flex-1 min-w-36 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
            <div className="h-9 w-28 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
            <div className="h-9 w-32 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          </div>
        </div>

        {/* 카드 그리드 스켈레톤 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <ClipSkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
