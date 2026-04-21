export default function ScheduleModalLoading() {
  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl dark:shadow-slate-900/50 overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 dark:border-slate-700">
        {/* 컬러 배너 */}
        <div className="h-32 w-full shrink-0 bg-slate-200 dark:bg-slate-700 animate-pulse" />

        {/* 메인 컨텐츠 */}
        <div className="p-8 space-y-8 flex-1">
          {/* 제목 + 태그들 */}
          <div className="space-y-6">
            <div className="h-9 w-3/4 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="flex flex-wrap gap-2.5">
              <div className="h-9 w-28 rounded-2xl bg-amber-100 dark:bg-amber-900/30 animate-pulse" />
              <div className="h-9 w-36 rounded-2xl bg-slate-100 dark:bg-slate-700 animate-pulse" />
              <div className="h-9 w-24 rounded-2xl bg-slate-100 dark:bg-slate-700 animate-pulse" />
            </div>
          </div>

          {/* 참여자 섹션 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-20 rounded-2xl bg-slate-100 dark:bg-slate-700 animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="flex gap-3 pt-4 border-t border-slate-50 dark:border-slate-700">
            <div className="flex-1 h-14 rounded-3xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="w-14 h-14 rounded-3xl bg-red-50 dark:bg-red-900/20 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
