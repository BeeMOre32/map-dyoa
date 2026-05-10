'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { announcements } from '@/config/announcements';

const STORAGE_KEY = 'dismissedAnnouncements';

type Props = {
  /** true면 부모 스택에서 위치·너비만 잡고, fixed는 쓰지 않습니다. */
  stacked?: boolean;
};

export default function AnnouncementToast({ stacked }: Props) {
  const [target, setTarget] = useState<(typeof announcements)[number] | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const dismissed: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
        const next = announcements.find((a) => !dismissed.includes(a.id));
        if (next) setTarget(next);
      } catch {}
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    if (!target) return;
    try {
      const dismissed: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set([...dismissed, target.id])]));
    } catch {}
    setTarget(null);
  };

  const outer = stacked
    ? 'relative w-full pointer-events-auto'
    : 'fixed bottom-4 right-4 z-[280] w-[min(320px,calc(100vw-2rem))] pointer-events-auto';

  return (
    <AnimatePresence>
      {target && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={outer}
        >
          <div className="flex items-start gap-3 rounded-2xl border border-indigo-200/80 bg-indigo-50/95 px-4 py-3 text-sm shadow-lg backdrop-blur-sm dark:border-indigo-800/60 dark:bg-indigo-950/90">
            <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
            <div className="min-w-0 flex-1">
              <p className="font-black text-indigo-950 dark:text-indigo-100">{target.title}</p>
              {target.content && (
                <p className="mt-0.5 text-xs font-medium leading-relaxed text-indigo-800/90 dark:text-indigo-200/90">
                  {target.content}
                </p>
              )}
              {target.href && (
                <Link
                  href={target.href}
                  onClick={dismiss}
                  className="mt-2 inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-[11px] font-black text-white shadow-sm transition-colors hover:bg-indigo-700"
                >
                  공지 보기
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="shrink-0 rounded-lg p-1 text-indigo-400 transition-colors hover:bg-indigo-200/50 hover:text-indigo-700 dark:hover:bg-indigo-800/50 dark:hover:text-indigo-200"
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
