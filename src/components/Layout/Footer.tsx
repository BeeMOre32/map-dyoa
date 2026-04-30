import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="hidden sm:flex shrink-0 border-t border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-6 py-2 items-center justify-center gap-4">
      <Link
        href="/help"
        className="text-[11px] font-bold text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
      >
        도움말
      </Link>
      <span className="text-slate-200 dark:text-slate-700 text-xs">|</span>
      <Link
        href="/privacy"
        className="text-[11px] font-bold text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
      >
        개인정보처리방침
      </Link>
      <span className="text-slate-200 dark:text-slate-700 text-xs">|</span>
      <span className="text-[11px] font-bold text-slate-300 dark:text-slate-600 select-none">
        © 2025 Map-Dyoa
      </span>
    </footer>
  );
}
