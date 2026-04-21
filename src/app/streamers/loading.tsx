export default function StreamersLoading() {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950 transition-colors">
      <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
        {/* 헤더 */}
        <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/20 shrink-0">
          <div className="space-y-2">
            <div className="h-6 w-40 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-4 w-56 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
          </div>
        </div>

        {/* 스트리머 그리드 */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col p-5 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                {/* 아바타 + 더보기 버튼 */}
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  <div className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                </div>
                {/* 이름 */}
                <div className="space-y-1.5">
                  <div className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  <div className="h-4 w-20 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                </div>
                {/* 배지 */}
                <div className="flex gap-2 mt-6">
                  <div className="h-5 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  <div className="h-5 w-14 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
