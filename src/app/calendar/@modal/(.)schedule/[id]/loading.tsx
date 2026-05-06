export default function ScheduleModalLoading() {
  return (
    <div className="fixed inset-0 z-70 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md">
      <div className="flex sm:flex-row sm:items-start sm:gap-3 w-full sm:w-auto">
        <div className="bg-white dark:bg-slate-800 w-full sm:max-w-lg rounded-t-4xl sm:rounded-[2.5rem] shadow-2xl dark:shadow-slate-900/50 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90dvh] border border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
          {/* 헤더 바 */}
          <div className="h-16 w-full shrink-0 bg-slate-200 dark:bg-slate-700 animate-pulse" />

          {/* 본문 */}
          <div className="p-5 sm:p-8 space-y-6 sm:space-y-8 flex-1 overflow-y-auto">
            <div className="space-y-4 sm:space-y-6">
              <div className="h-9 w-3/4 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="flex flex-wrap gap-2.5">
                <div className="h-9 w-28 rounded-2xl bg-amber-100 dark:bg-amber-900/30 animate-pulse" />
                <div className="h-9 w-36 rounded-2xl bg-slate-100 dark:bg-slate-700 animate-pulse" />
                <div className="h-9 w-24 rounded-2xl bg-slate-100 dark:bg-slate-700 animate-pulse" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-9 w-28 rounded-2xl bg-slate-100 dark:bg-slate-700 animate-pulse"
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-12 w-full rounded-2xl bg-slate-100 dark:bg-slate-700 animate-pulse" />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-50 dark:border-slate-700">
              <div className="flex-1 h-14 rounded-3xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="w-14 h-14 rounded-3xl bg-red-50 dark:bg-red-900/20 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="hidden sm:flex flex-col bg-white dark:bg-slate-800 w-72 rounded-[2.5rem] shadow-2xl dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 overflow-hidden max-h-[90dvh] animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="h-12 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-8 w-20 rounded-xl bg-slate-100 dark:bg-slate-700 animate-pulse" />
            <div className="space-y-2">
              <div className="h-14 w-full rounded-2xl bg-slate-100 dark:bg-slate-700 animate-pulse" />
              <div className="h-14 w-full rounded-2xl bg-slate-100 dark:bg-slate-700 animate-pulse" />
              <div className="h-14 w-full rounded-2xl bg-slate-100 dark:bg-slate-700 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
