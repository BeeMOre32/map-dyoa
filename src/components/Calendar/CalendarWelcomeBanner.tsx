'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Sparkles, X, ArrowRight, LayoutGrid, Filter, MonitorPlay,
} from 'lucide-react';
import {
  CALENDAR_WELCOME_DISMISSED_KEY,
  HELP_TOAST_DISMISSED_KEY,
} from '@/constants/onboarding';

function dismissOnboarding() {
  localStorage.setItem(CALENDAR_WELCOME_DISMISSED_KEY, '1');
  localStorage.setItem(HELP_TOAST_DISMISSED_KEY, '1');
}

export default function CalendarWelcomeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(CALENDAR_WELCOME_DISMISSED_KEY)) return;
    setVisible(true);
  }, []);

  const dismiss = () => {
    dismissOnboarding();
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="mb-4 shrink-0 overflow-hidden rounded-2xl border border-indigo-200/80 bg-linear-to-br from-indigo-50/90 via-white to-violet-50/50 shadow-sm dark:border-indigo-900/50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-violet-950/30"
        >
          <div className="flex gap-3 p-3 sm:p-4">
            <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md dark:bg-indigo-500">
              <Sparkles className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-900 dark:text-white sm:text-base">
                지도동 방송 일정을 한곳에서
              </p>
              <ul className="mt-2 space-y-1.5 text-[12px] font-medium leading-snug text-slate-600 dark:text-slate-400 sm:text-[13px]">
                <li className="flex gap-2">
                  <LayoutGrid
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500 dark:text-indigo-400"
                    aria-hidden
                  />
                  <span>주간·월간으로 날짜별 일정을 확인할 수 있어요.</span>
                </li>
                <li className="flex gap-2">
                  <Filter
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500 dark:text-indigo-400"
                    aria-hidden
                  />
                  <span>아래 필터에서 멤버·게임만 골라 볼 수 있어요.</span>
                </li>
                <li className="flex gap-2">
                  <MonitorPlay
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500 dark:text-indigo-400"
                    aria-hidden
                  />
                  <span>
                    <strong className="font-black text-slate-700 dark:text-slate-200">멀티뷰</strong>는
                    상단 메뉴에서 여러 방송을 한 화면에 같이 볼 수 있어요.
                  </span>
                </li>
              </ul>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  href="/help"
                  onClick={dismiss}
                  className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-[11px] font-black text-white shadow-sm transition-colors hover:bg-indigo-700 sm:text-xs"
                >
                  <BookOpen className="h-3.5 w-3.5" aria-hidden />
                  더 쓰는 방법이 궁금하면 이용 가이드
                  <ArrowRight className="h-3 w-3" aria-hidden />
                </Link>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 sm:text-[11px]">
                  클립·라이브도 상단 메뉴에서 열 수 있어요.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="shrink-0 self-start rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/80 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="안내 닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
