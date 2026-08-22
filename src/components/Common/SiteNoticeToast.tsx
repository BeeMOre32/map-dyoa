'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Info, X } from 'lucide-react';
import { SITE_NOTICE_DISMISS_KEY, type SiteNoticeView } from './site-notice-shared';

type Props = {
  notice: SiteNoticeView;
  /** true면 부모 스택에서 위치·너비만 잡고, fixed는 쓰지 않습니다. */
  stacked?: boolean;
};

const STYLES = {
  WARNING: {
    wrap: 'border-amber-200/80 bg-amber-50/95 dark:border-amber-800/60 dark:bg-amber-950/90',
    icon: 'text-amber-600 dark:text-amber-400',
    title: 'text-amber-950 dark:text-amber-100',
    body: 'text-amber-800/90 dark:text-amber-200/90',
    btn: 'text-amber-400 hover:bg-amber-200/50 hover:text-amber-700 dark:hover:bg-amber-800/50 dark:hover:text-amber-200',
    Icon: AlertTriangle,
  },
  INFO: {
    wrap: 'border-indigo-200/80 bg-indigo-50/95 dark:border-indigo-800/60 dark:bg-indigo-950/90',
    icon: 'text-indigo-600 dark:text-indigo-400',
    title: 'text-indigo-950 dark:text-indigo-100',
    body: 'text-indigo-800/90 dark:text-indigo-200/90',
    btn: 'text-indigo-400 hover:bg-indigo-200/50 hover:text-indigo-700 dark:hover:bg-indigo-800/50 dark:hover:text-indigo-200',
    Icon: Info,
  },
} as const;

/** 주의/정보(WARNING·INFO) 공지 — 우하단 토스트 */
export default function SiteNoticeToast({ notice, stacked }: Props) {
  const [show, setShow] = useState(false);
  const dismissKey = notice.dismissKey;

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const dismissed: string[] = JSON.parse(localStorage.getItem(SITE_NOTICE_DISMISS_KEY) ?? '[]');
        setShow(!dismissed.includes(dismissKey));
      } catch {
        setShow(true);
      }
    }, 1200);
    return () => clearTimeout(id);
  }, [dismissKey]);

  const dismiss = () => {
    try {
      const dismissed: string[] = JSON.parse(localStorage.getItem(SITE_NOTICE_DISMISS_KEY) ?? '[]');
      localStorage.setItem(
        SITE_NOTICE_DISMISS_KEY,
        JSON.stringify([...new Set([...dismissed, dismissKey])].slice(-30)),
      );
    } catch {}
    setShow(false);
  };

  const s = notice.level === 'WARNING' ? STYLES.WARNING : STYLES.INFO;
  const Icon = s.Icon;
  const outer = stacked
    ? 'relative w-full pointer-events-auto'
    : 'fixed bottom-4 right-4 z-[280] w-[min(320px,calc(100vw-2rem))] pointer-events-auto';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={outer}
        >
          <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-lg backdrop-blur-sm ${s.wrap}`}>
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${s.icon}`} />
            <div className="min-w-0 flex-1">
              <p className={`font-black ${s.title}`}>{notice.title}</p>
              {notice.body && (
                <p className={`mt-0.5 whitespace-pre-line text-xs font-medium leading-relaxed ${s.body}`}>
                  {notice.body}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={dismiss}
              className={`shrink-0 rounded-lg p-1 transition-colors ${s.btn}`}
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
