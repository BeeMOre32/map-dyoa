export function ClipSkeletonCard() {
  return (
    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-pulse">
      <div className="aspect-video bg-slate-200 dark:bg-slate-700" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded-full w-4/5" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-2/3" />
        <div className="flex gap-1.5 pt-1">
          <div className="h-5 w-12 bg-slate-200 dark:bg-slate-700 rounded-full" />
          <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>
      </div>
    </div>
  );
}
