'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { announcementToast } from '@/config/announcements';
import type { Announcement, AnnouncementAccent } from '@/config/announcements';

const STORAGE_KEY = 'dismissedAnnouncements';

/** accent별 정적 클래스 묶음 (Tailwind 동적 클래스 금지 대응) */
const ACCENT_THEMES: Record<
  AnnouncementAccent,
  { box: string; icon: string; title: string; content: string; button: string; close: string }
> = {
  indigo: {
    box: 'border-indigo-200/80 bg-indigo-50/95 dark:border-indigo-800/60 dark:bg-indigo-950/90',
    icon: 'text-indigo-600 dark:text-indigo-400',
    title: 'text-indigo-950 dark:text-indigo-100',
    content: 'text-indigo-800/90 dark:text-indigo-200/90',
    button: 'bg-indigo-600 hover:bg-indigo-700',
    close:
      'text-indigo-400 hover:bg-indigo-200/50 hover:text-indigo-700 dark:hover:bg-indigo-800/50 dark:hover:text-indigo-200',
  },
  teal: {
    box: 'border-teal-200/80 bg-teal-50/95 dark:border-teal-800/60 dark:bg-teal-950/90',
    icon: 'text-teal-600 dark:text-teal-400',
    title: 'text-teal-950 dark:text-teal-100',
    content: 'text-teal-800/90 dark:text-teal-200/90',
    button: 'bg-teal-600 hover:bg-teal-700',
    close:
      'text-teal-400 hover:bg-teal-200/50 hover:text-teal-700 dark:hover:bg-teal-800/50 dark:hover:text-teal-200',
  },
  amber: {
    box: 'border-amber-200/80 bg-amber-50/95 dark:border-amber-800/60 dark:bg-amber-950/90',
    icon: 'text-amber-600 dark:text-amber-400',
    title: 'text-amber-950 dark:text-amber-100',
    content: 'text-amber-800/90 dark:text-amber-200/90',
    button: 'bg-amber-600 hover:bg-amber-700',
    close:
      'text-amber-400 hover:bg-amber-200/50 hover:text-amber-700 dark:hover:bg-amber-800/50 dark:hover:text-amber-200',
  },
  rose: {
    box: 'border-rose-200/80 bg-rose-50/95 dark:border-rose-800/60 dark:bg-rose-950/90',
    icon: 'text-rose-600 dark:text-rose-400',
    title: 'text-rose-950 dark:text-rose-100',
    content: 'text-rose-800/90 dark:text-rose-200/90',
    button: 'bg-rose-600 hover:bg-rose-700',
    close:
      'text-rose-400 hover:bg-rose-200/50 hover:text-rose-700 dark:hover:bg-rose-800/50 dark:hover:text-rose-200',
  },
};

type Props = {
  /** true면 부모 스택에서 위치·너비만 잡고, fixed는 쓰지 않습니다. */
  stacked?: boolean;
};

export default function AnnouncementToast({ stacked }: Props) {
  const [target, setTarget] = useState<Announcement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const dismissed: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
        if (!dismissed.includes(announcementToast.id)) {
          setTarget(announcementToast);
        }
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

  const theme = ACCENT_THEMES[target?.accent ?? 'indigo'];

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
          <div
            className={cn(
              'flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-lg backdrop-blur-sm',
              theme.box,
            )}
          >
            <Megaphone className={cn('mt-0.5 h-4 w-4 shrink-0', theme.icon)} />
            <div className="min-w-0 flex-1">
              <p className={cn('font-black', theme.title)}>{target.title}</p>
              {target.content && (
                <p className={cn('mt-0.5 text-xs font-medium leading-relaxed', theme.content)}>
                  {target.content}
                </p>
              )}
              {target.href && (
                <Link
                  href={target.href}
                  onClick={dismiss}
                  className={cn(
                    'mt-2 inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-black text-white shadow-sm transition-colors',
                    theme.button,
                  )}
                >
                  공지 보기
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={dismiss}
              className={cn('shrink-0 rounded-lg p-1 transition-colors', theme.close)}
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
