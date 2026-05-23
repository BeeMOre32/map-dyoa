export default function CalendarHideEndedBanner() {
  return (
    <div className="flex w-fit shrink-0 items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-600 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-400">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 dark:bg-amber-500" />
      종료된 방송 숨김 중
    </div>
  );
}
