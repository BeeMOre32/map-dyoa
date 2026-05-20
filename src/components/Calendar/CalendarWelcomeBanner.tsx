'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  BookOpen, Sparkles, X, ArrowRight, LayoutGrid, Filter, MonitorPlay, BarChart3,
} from 'lucide-react';
import {
  CALENDAR_WELCOME_DISMISSED_KEY,
  HELP_TOAST_DISMISSED_KEY,
} from '@/constants/onboarding';
import {
  statsBannerVariants,
  statsInteractiveHover,
  statsListVariants,
  statsRowVariants,
} from '@/lib/statsMotion';

function dismissOnboarding() {
  localStorage.setItem(CALENDAR_WELCOME_DISMISSED_KEY, '1');
  localStorage.setItem(HELP_TOAST_DISMISSED_KEY, '1');
}

const TIPS: { id: string; icon: typeof LayoutGrid; text: ReactNode }[] = [
  { id: 'view', icon: LayoutGrid, text: '주간·월간으로 날짜별 일정을 확인할 수 있어요.' },
  { id: 'filter', icon: Filter, text: '아래 필터에서 멤버·게임만 골라 볼 수 있어요.' },
  {
    id: 'multiview',
    icon: MonitorPlay,
    text: (
      <>
        <strong className="font-black text-slate-700 dark:text-slate-200">멀티뷰</strong>는
        상단 메뉴에서 여러 방송을 한 화면에 같이 볼 수 있어요.
      </>
    ),
  },
  {
    id: 'stats',
    icon: BarChart3,
    text: (
      <>
        <span className="font-black text-indigo-600 dark:text-indigo-400">월간 통계</span>
        는 설정 → 정보 메뉴에서도 열 수 있어요.
      </>
    ),
  },
];

export default function CalendarWelcomeBanner() {
  const reducedMotion = useReducedMotion();
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
          initial={reducedMotion ? false : 'hidden'}
          animate="visible"
          exit="exit"
          variants={statsBannerVariants}
          className="mb-4 shrink-0 overflow-hidden rounded-2xl border border-indigo-200/80 bg-linear-to-br from-indigo-50/90 via-white to-violet-50/50 shadow-sm dark:border-indigo-900/50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-violet-950/30"
        >
          <div className="flex gap-3 p-3 sm:p-4">
            <motion.div
              initial={reducedMotion ? false : { scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 340, damping: 26, delay: 0.06 }}
              className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md dark:bg-indigo-500"
            >
              <Sparkles className="h-5 w-5" aria-hidden />
            </motion.div>
            <div className="min-w-0 flex-1">
              <motion.p
                initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.04 }}
                className="text-sm font-black text-slate-900 dark:text-white sm:text-base"
              >
                지도동 방송 일정을 한곳에서
              </motion.p>
              <motion.ul
                className="mt-2 space-y-1.5 text-[12px] font-medium leading-snug text-slate-600 dark:text-slate-400 sm:text-[13px]"
                variants={statsListVariants}
                initial={reducedMotion ? false : 'hidden'}
                animate="visible"
              >
                {TIPS.map((tip) => {
                  const Icon = tip.icon;
                  return (
                    <motion.li key={tip.id} variants={statsRowVariants} className="flex gap-2">
                      <Icon
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500 dark:text-indigo-400"
                        aria-hidden
                      />
                      <span>{tip.text}</span>
                    </motion.li>
                  );
                })}
              </motion.ul>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <motion.div {...(reducedMotion ? {} : statsInteractiveHover)}>
                  <Link
                    href="/help"
                    onClick={dismiss}
                    className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-[11px] font-black text-white shadow-sm transition-colors hover:bg-indigo-700 sm:text-xs"
                  >
                    <BookOpen className="h-3.5 w-3.5" aria-hidden />
                    더 쓰는 방법이 궁금하면 이용 가이드
                    <ArrowRight className="h-3 w-3" aria-hidden />
                  </Link>
                </motion.div>
                <motion.div {...(reducedMotion ? {} : statsInteractiveHover)}>
                  <Link
                    href="/calendar/monthly"
                    onClick={dismiss}
                    className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-white/80 px-3 py-1.5 text-[11px] font-black text-indigo-600 transition-colors hover:border-indigo-300 hover:bg-white sm:text-xs dark:border-indigo-800 dark:bg-slate-900/60 dark:text-indigo-400"
                  >
                    <BarChart3 className="h-3.5 w-3.5" aria-hidden />
                    월간 통계 보기
                  </Link>
                </motion.div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 sm:text-[11px]">
                  클립·라이브도 상단 메뉴에서 열 수 있어요.
                </span>
              </div>
            </div>
            <motion.button
              type="button"
              onClick={dismiss}
              {...(reducedMotion ? {} : statsInteractiveHover)}
              className="shrink-0 self-start rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/80 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="안내 닫기"
            >
              <X className="h-4 w-4" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
