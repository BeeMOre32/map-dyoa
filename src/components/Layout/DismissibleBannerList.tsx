'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Info, AlertTriangle, Megaphone, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Announcement } from '@/config/announcements';

const STORAGE_KEY = 'dismissedAnnouncements';

const typeStyles = {
  info: {
    wrapper: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300',
    icon: <Info className="w-4 h-4 shrink-0" />,
  },
  warning: {
    wrapper: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300',
    icon: <AlertTriangle className="w-4 h-4 shrink-0" />,
  },
  urgent: {
    wrapper: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300',
    icon: <Megaphone className="w-4 h-4 shrink-0" />,
  },
} as const;

export default function DismissibleBannerList({ announcements }: { announcements: Announcement[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setDismissed(new Set(JSON.parse(stored)));
    } catch {}
  }, []);

  const dismiss = (id: string) => {
    const next = new Set([...dismissed, id]);
    setDismissed(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])); } catch {}
  };

  if (!mounted) return null;

  const visible = announcements.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="shrink-0">
      <AnimatePresence initial={false}>
        {visible.map((a) => {
          const style = typeStyles[a.type as keyof typeof typeStyles] ?? typeStyles.info;
          const inner = (
            <div className="flex items-center gap-3 px-4 py-2.5 max-w-5xl mx-auto">
              {style.icon}
              <div className="flex-1 min-w-0">
                <span className="font-black text-sm">{a.title}</span>
                {a.content && (
                  <span className="text-sm font-medium opacity-75 ml-2">{a.content}</span>
                )}
              </div>
              {a.href && (
                <span className="flex items-center gap-0.5 text-xs font-black opacity-70 shrink-0">
                  자세히 <ChevronRight className="w-3 h-3" />
                </span>
              )}
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismiss(a.id); }}
                className="shrink-0 p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                aria-label="닫기"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );

          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className={`border-b ${style.wrapper}`}
            >
              {a.href ? (
                <Link href={a.href} className="block hover:opacity-80 transition-opacity">
                  {inner}
                </Link>
              ) : inner}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
