import { MessageSquare } from 'lucide-react';

export default function AdminFeedbacksLoading() {
  return (
    <div className="p-8 space-y-8 bg-white dark:bg-slate-950 min-h-screen transition-colors">
      {/* 헤더 */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-indigo-300 dark:text-indigo-700" />
          <div className="h-9 w-48 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
        <div className="h-5 w-60 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
      </div>

      {/* 피드백 카드 목록 */}
      <div className="grid gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-4xl border border-slate-100 dark:border-slate-700 p-8 flex flex-col md:flex-row gap-6 items-start"
          >
            {/* 왼쪽: 상태 뱃지 + 날짜 */}
            <div className="shrink-0 flex flex-col gap-3 min-w-35">
              <div className="h-7 w-20 rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-7 w-32 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            </div>
            {/* 중앙: 내용 */}
            <div className="flex-1 space-y-3">
              <div className="flex gap-2">
                <div className="h-6 w-24 rounded-full bg-indigo-50 dark:bg-indigo-900/20 animate-pulse" />
                <div className="h-6 w-32 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-4 w-3/4 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </div>
            </div>
            {/* 오른쪽: 버튼 */}
            <div className="shrink-0">
              <div className="h-9 w-24 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
