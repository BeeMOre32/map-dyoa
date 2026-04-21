export default function CalendarLoading() {
  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 transition-colors">
      <div className="flex-1 flex flex-col p-4 md:p-6 h-full max-h-[calc(100vh-100px)]">
        {/* 상단 컨트롤 */}
        <div className="flex justify-between items-center mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-20 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-7 w-28 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-32 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-9 w-24 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
        </div>

        {/* 캘린더 본체 */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-4xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/60">
            {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
              <div key={d} className="py-3 flex justify-center">
                <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              </div>
            ))}
          </div>

          {/* 날짜 셀 그리드 (주간 7칸) */}
          <div className="grid grid-cols-7 flex-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="p-2 border-r border-b border-slate-100 dark:border-slate-800 last:border-r-0 space-y-1.5"
              >
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                {i % 3 === 0 && (
                  <div className="h-5 rounded-md bg-slate-100 dark:bg-slate-800 animate-pulse" />
                )}
                {i % 2 === 0 && (
                  <div className="h-5 rounded-md bg-amber-50 dark:bg-amber-900/20 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
