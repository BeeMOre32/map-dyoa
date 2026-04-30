export default function StreamerDetailLoading() {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 md:p-8 bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-xl">
      <div className="animate-pulse bg-white dark:bg-slate-800 w-full max-w-3xl rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col max-h-[90dvh] border border-slate-100 dark:border-slate-700">
        {/* 상단 프로필 배너 */}
        <div className="p-10 border-b border-slate-100 dark:border-slate-700 shrink-0 relative flex gap-8 items-center bg-slate-50 dark:bg-slate-700/30">
          <div className="absolute top-6 right-6 w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-600" />
          <div className="w-24 h-24 rounded-3xl bg-slate-200 dark:bg-slate-600 flex-none" />
          <div className="flex-1 space-y-3">
            <div className="h-10 w-48 rounded-xl bg-slate-200 dark:bg-slate-600" />
            <div className="h-4 w-64 rounded bg-slate-100 dark:bg-slate-700" />
          </div>
        </div>

        {/* 본체 */}
        <div className="p-10 space-y-10 flex-1 bg-white dark:bg-slate-800">
          <div className="space-y-4 px-2">
            <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-28 rounded-3xl bg-slate-100 dark:bg-slate-700/50" />
          </div>
          <div className="space-y-4 px-2">
            <div className="h-4 w-36 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="flex gap-3">
              <div className="h-9 w-24 rounded-xl bg-slate-100 dark:bg-slate-700" />
              <div className="h-9 w-20 rounded-xl bg-slate-100 dark:bg-slate-700" />
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="p-8 bg-slate-50 dark:bg-slate-700 border-t border-slate-100 dark:border-slate-700 flex gap-3 shrink-0">
          <div className="flex-1 h-14 rounded-2xl bg-slate-200 dark:bg-slate-600" />
          <div className="flex-1 h-14 rounded-2xl bg-indigo-200 dark:bg-indigo-800/50" />
        </div>
      </div>
    </div>
  );
}
