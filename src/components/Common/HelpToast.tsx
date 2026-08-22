'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import {
  CALENDAR_WELCOME_DISMISSED_KEY,
  HELP_TOAST_DISMISSED_KEY,
} from '@/constants/onboarding';

type Props = {
  stacked?: boolean;
};

export default function HelpToast({ stacked }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 예전에 가이드 토스트만 닫은 사용자는 캘린더 배너를 다시 띄우지 않음
    if (
      localStorage.getItem(HELP_TOAST_DISMISSED_KEY) &&
      !localStorage.getItem(CALENDAR_WELCOME_DISMISSED_KEY)
    ) {
      localStorage.setItem(CALENDAR_WELCOME_DISMISSED_KEY, '1');
    }

    if (localStorage.getItem(HELP_TOAST_DISMISSED_KEY)) return;
    // 캘린더 첫 방문 안내를 처리하기 전에는 토스트 생략(배너와 겹침 방지)
    if (!localStorage.getItem(CALENDAR_WELCOME_DISMISSED_KEY)) return;

    const timer = setTimeout(() => setVisible(true), 2200);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    localStorage.setItem(HELP_TOAST_DISMISSED_KEY, '1');
    setVisible(false);
  };

  const outer = stacked
    ? 'relative w-full pointer-events-auto'
    : 'fixed bottom-4 right-4 z-[280] w-[min(320px,calc(100vw-2rem))] pointer-events-auto';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={outer}
        >
          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 text-sm shadow-lg backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
            <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-400" />
            <div className="min-w-0 flex-1">
              <p className="font-black text-slate-900 dark:text-white">처음 방문하셨나요?</p>
              <p className="mt-0.5 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-400">
                이용 가이드에서 캘린더 활용법을 확인하세요.
              </p>
              <Link
                href="/help"
                onClick={dismiss}
                className="mt-2 inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-[11px] font-black text-white shadow-sm transition-colors hover:bg-indigo-700"
              >
                이용 가이드
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
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
