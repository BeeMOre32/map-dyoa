export default function BongnudoLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-slate-950">
      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-5 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-4xl">
          <div className="h-7 w-28 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="mt-2 h-3 w-56 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-4xl grid-cols-3 gap-2 px-4 py-6 sm:grid-cols-5">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-900" />
        ))}
      </div>
    </div>
  );
}
