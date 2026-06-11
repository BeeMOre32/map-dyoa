'use client';

import { useState, useTransition } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Flag, Play, RotateCcw, Square } from 'lucide-react';
import ConfirmModal from '@/components/Common/ConfirmModal';
import {
  endHoi4ExamAction,
  resetHoi4ExamAction,
  startHoi4ExamAction,
} from '@/app/lab/time-attack/actions';
import type { Hoi4ExamRuntimeState } from '@/lib/hoi4-exam-state';
import type { ExamPhase } from '@/lib/hoi4GermanExam';
import ExamTimeAdjustPanel from '@/components/time-attack/ExamTimeAdjustPanel';
import { cn } from '@/lib/utils';

type Props = {
  phase: ExamPhase;
  runtime: Hoi4ExamRuntimeState;
  onRuntimeChange: (state: Hoi4ExamRuntimeState) => void;
  variant?: 'default' | 'hero';
};

export default function ExamOperatePanel({
  phase,
  runtime,
  onRuntimeChange,
  variant = 'default',
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const run = (action: () => Promise<{ success: boolean; data?: Hoi4ExamRuntimeState; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success || !result.data) {
        setError(result.error ?? '처리에 실패했습니다.');
        return;
      }
      onRuntimeChange(result.data);
    });
  };

  const statusLabel =
    phase === 'live' ? '진행 중' : phase === 'after' ? '종료됨' : runtime.manualStartedAt ? '종료됨' : '출발 전';

  const isHero = variant === 'hero';

  return (
    <div
      className={cn(
        'rounded-xl border p-3',
        isHero
          ? 'border-amber-200/80 bg-white/90 dark:border-amber-900/40 dark:bg-slate-950/50'
          : 'border-violet-200/80 bg-violet-50/60 dark:border-violet-900/40 dark:bg-violet-950/20',
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p
          className={cn(
            'inline-flex items-center gap-1.5 text-[11px] font-black',
            isHero
              ? 'text-amber-800 dark:text-amber-300'
              : 'text-violet-800 dark:text-violet-300',
          )}
        >
          <Flag className="h-3.5 w-3.5" />
          운영 제어
        </p>
        <span
          className={cn(
            'text-[10px] font-bold',
            isHero
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-violet-600 dark:text-violet-400',
          )}
        >
          {statusLabel}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:max-w-md">
        <button
          type="button"
          disabled={pending || phase === 'live'}
          onClick={() => run(startHoi4ExamAction)}
          className={cn(
            'inline-flex items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-[11px] font-black transition-colors disabled:opacity-40',
            'border-emerald-300 bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
          )}
        >
          <Play className="h-3.5 w-3.5" />
          출발
        </button>
        <button
          type="button"
          disabled={pending || phase !== 'live'}
          onClick={() => run(endHoi4ExamAction)}
          className={cn(
            'inline-flex items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-[11px] font-black transition-colors disabled:opacity-40',
            'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
          )}
        >
          <Square className="h-3.5 w-3.5" />
          종료
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirmReset(true)}
          className={cn(
            'inline-flex items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-[11px] font-black transition-colors disabled:opacity-40',
            'border-violet-300 bg-white text-violet-800 hover:bg-violet-50 dark:border-violet-800 dark:bg-slate-900 dark:text-violet-200',
          )}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          리셋
        </button>
      </div>

      {error ? (
        <p className="mt-2 text-[10px] font-bold text-red-600 dark:text-red-400">{error}</p>
      ) : (
        <p
          className={cn(
            'mt-2 text-[10px] font-medium',
            isHero
              ? 'text-slate-500 dark:text-slate-400'
              : 'text-violet-700/80 dark:text-violet-400/80',
          )}
        >
          준비되면 출발을 눌러 주세요.
        </p>
      )}

      <ExamTimeAdjustPanel
        phase={phase}
        runtime={runtime}
        onRuntimeChange={onRuntimeChange}
        variant={variant}
      />

      <AnimatePresence>
        {confirmReset ? (
          <ConfirmModal
            message="출발·종료 상태를 초기화합니다. 진행 중이거나 종료된 대회라면 되돌릴 수 없습니다."
            confirmLabel="리셋"
            isLoading={pending}
            onCancel={() => setConfirmReset(false)}
            onConfirm={() => {
              run(async () => {
                const result = await resetHoi4ExamAction();
                if (result.success) setConfirmReset(false);
                return result;
              });
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
