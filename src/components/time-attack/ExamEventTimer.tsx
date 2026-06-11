'use client';

import { useEffect, useRef, useState } from 'react';
import {
  formatExamCountdown,
  formatExamElapsed,
  type ExamTimerMode,
  type ExamTestPhase,
} from '@/lib/hoi4GermanExam';
import { cn } from '@/lib/utils';

type Props = {
  timerMode: ExamTimerMode;
  timerAnchorAt: string | null;
  testPhase?: ExamTestPhase;
};

export default function ExamEventTimer({
  timerMode,
  timerAnchorAt,
  testPhase = 'auto',
}: Props) {
  /** SSR·hydration 시각 차이로 mismatch 방지 — 마운트 후에만 갱신 */
  const [now, setNow] = useState<number | null>(null);
  const liveTestAnchorRef = useRef(Date.now() - (2 * 3600 + 18 * 60) * 1000);

  const effectiveMode =
    testPhase === 'live'
      ? 'elapsed'
      : testPhase === 'before'
        ? timerMode === 'countdown'
          ? 'countdown'
          : 'waiting'
        : testPhase === 'after'
          ? 'hidden'
          : timerMode;

  const anchorMs =
    testPhase === 'live'
      ? liveTestAnchorRef.current
      : timerAnchorAt
        ? new Date(timerAnchorAt).getTime()
        : null;

  useEffect(() => {
    if (effectiveMode === 'hidden' || effectiveMode === 'waiting' || anchorMs == null) {
      return;
    }

    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [effectiveMode, anchorMs]);

  if (effectiveMode === 'hidden') return null;

  if (effectiveMode === 'waiting') {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-amber-300/80 bg-amber-50/50 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-950/20 sm:px-5">
        <p className="text-[10px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-400">
          출발 대기
        </p>
        <p className="mt-0.5 text-sm font-bold text-amber-900/90 dark:text-amber-200/90">
          운영자가 출발을 누르면 경과 타이머가 시작됩니다
        </p>
      </div>
    );
  }

  if (anchorMs == null) return null;

  const isCountdown = effectiveMode === 'countdown';
  const display =
    now == null
      ? isCountdown
        ? '0일 00:00:00'
        : '00:00:00'
      : isCountdown
        ? formatExamCountdown(anchorMs - now)
        : formatExamElapsed(now - anchorMs);

  return (
    <div
      className={cn(
        'mt-4 rounded-2xl border px-4 py-3 sm:px-5',
        isCountdown
          ? 'border-amber-200/70 bg-white/90 dark:border-amber-900/40 dark:bg-slate-950/50'
          : 'border-emerald-200/70 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20',
      )}
    >
      <p
        className={cn(
          'text-[10px] font-black uppercase tracking-wide',
          isCountdown
            ? 'text-amber-700 dark:text-amber-400'
            : 'text-emerald-700 dark:text-emerald-400',
        )}
      >
        {isCountdown ? '예정 시각까지' : '경과 시간'}
      </p>
      <p
        aria-busy={now == null}
        className={cn(
          'mt-0.5 min-h-[2rem] font-black tabular-nums tracking-tight sm:min-h-[2.25rem]',
          isCountdown
            ? 'text-2xl text-amber-600 sm:text-3xl dark:text-amber-400'
            : 'text-2xl text-emerald-600 sm:text-3xl dark:text-emerald-400',
          now == null && 'animate-pulse text-transparent',
        )}
      >
        {display}
      </p>
    </div>
  );
}
