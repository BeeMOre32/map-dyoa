export default function CalendarLoading() {
  return (
    <div className="flex-1 flex flex-col min-h-0 p-4 md:p-6 gap-3 bg-slate-50/50 dark:bg-slate-950 animate-pulse">
      {/* 상단 컨트롤 */}
      <div className="flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-6 w-32 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-9 w-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-9 w-16 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-9 w-16 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>

      {/* 필터 바 */}
      <div className="flex gap-2 shrink-0 flex-wrap">
        <div className="h-8 w-20 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-8 w-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-8 w-20 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* 캘린더 본체 */}
      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 shrink-0">
          {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
            <div key={d} className="py-3 flex justify-center">
              <div className="h-3.5 w-3.5 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>

        {/* 날짜 셀 */}
        <div className="grid grid-cols-7 flex-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="p-2 border-r border-slate-100 dark:border-slate-800 last:border-r-0 space-y-1.5 overflow-hidden"
            >
              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800" />
              {i % 2 === 0 && (
                <div className="h-13 rounded-xl bg-slate-100 dark:bg-slate-800" />
              )}
              {i % 3 === 0 && (
                <div className="h-13 rounded-xl bg-amber-50 dark:bg-amber-900/20" />
              )}
              {i === 1 && (
                <div className="h-13 rounded-xl bg-slate-100 dark:bg-slate-800" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
