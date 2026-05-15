/** 모달 로딩 — 슬라이드/줌 없이 배경만 즉시 표시, 내부 블록만 pulse */
export function ScheduleDetailModalSkeleton({
  showSidePanel = true,
}: {
  showSidePanel?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-70 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md">
      <div className="flex w-full sm:w-auto sm:flex-row sm:items-start sm:gap-3">
        <div className="flex w-full max-h-[92dvh] flex-col overflow-hidden rounded-t-4xl border border-slate-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800 sm:max-h-[90dvh] sm:max-w-lg sm:rounded-[2.5rem]">
          <div className="h-16 w-full shrink-0 animate-pulse bg-slate-200 dark:bg-slate-700" />
          <div className="flex-1 space-y-5 overflow-hidden p-5 sm:p-8">
            <div className="h-9 w-3/4 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
            <div className="flex flex-wrap gap-2">
              <div className="h-9 w-28 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-700/80" />
              <div className="h-9 w-36 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-700/80" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-9 w-28 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-700/80"
                />
              ))}
            </div>
            <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-700/80" />
            <div className="flex gap-3 border-t border-slate-100 pt-4 dark:border-slate-700">
              <div className="h-14 flex-1 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-700" />
              <div className="h-14 w-14 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-700/80" />
            </div>
          </div>
        </div>
        {showSidePanel && (
          <div className="hidden max-h-[90dvh] w-72 flex-col overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800 sm:flex">
            <div className="h-12 animate-pulse border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-700/30" />
            <div className="space-y-3 p-4">
              <div className="h-8 w-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700/80" />
              <div className="h-14 w-full animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-700/80" />
              <div className="h-14 w-full animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-700/80" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function DayScheduleModalSkeleton() {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm dark:bg-slate-950/60">
      <div className="flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="shrink-0 border-b border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="h-8 w-40 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
          <div className="mt-2 h-4 w-28 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="flex-1 space-y-4 overflow-hidden bg-slate-50/30 p-6 dark:bg-slate-950/40">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-4xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
        <div className="shrink-0 border-t border-slate-100 p-6 dark:border-slate-800">
          <div className="mx-auto h-12 w-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  );
}

export function CalendarPageSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 bg-slate-50/50 p-4 dark:bg-slate-950 md:p-6">
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-6 w-32 rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="grid shrink-0 grid-cols-7 border-b border-slate-100 dark:border-slate-800">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex justify-center py-3">
              <div className="h-3.5 w-3.5 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
        <div className="grid flex-1 grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="space-y-1.5 border-b border-r border-slate-100 p-2 last:border-r-0 dark:border-slate-800"
            >
              <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
