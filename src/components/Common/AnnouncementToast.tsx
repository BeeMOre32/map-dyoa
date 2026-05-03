'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { announcements } from '@/config/announcements';

const STORAGE_KEY = 'dismissedAnnouncements';

export default function AnnouncementToast() {
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

  return (
    <AnimatePresence>
      {target && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="fixed bottom-6 left-4 sm:left-6 z-[200] max-w-xs w-[calc(100vw-2rem)] sm:w-72"
        >
          <div className="bg-white dark:bg-slate-800 rounded-[1.75rem] shadow-2xl shadow-slate-300/40 dark:shadow-black/50 border border-slate-100 dark:border-slate-700 p-5 flex items-start gap-4">
            <div className="shrink-0 p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 rounded-2xl">
              <Megaphone className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-800 dark:text-white mb-0.5">
                {target.title}
              </p>
              {target.content && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3 leading-relaxed">
                  {target.content}
                </p>
              )}
              {target.href && (
                <Link
                  href={target.href}
                  onClick={dismiss}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black transition-colors shadow-md shadow-indigo-200 dark:shadow-indigo-950"
                >
                  공지 확인하기
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            <button
              onClick={dismiss}
              className="shrink-0 p-1.5 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              aria-label="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
