'use client';

import { FlaskConical, RotateCcw } from 'lucide-react';
import type { ExamTestPhase } from '@/lib/hoi4GermanExam';
import { cn } from '@/lib/utils';

const PHASE_OPTIONS: { value: ExamTestPhase; label: string }[] = [
  { value: 'auto', label: '실제' },
  { value: 'before', label: '이벤트 전' },
  { value: 'live', label: '진행 중' },
  { value: 'after', label: '종료' },
];

type Props = {
  testPhase: ExamTestPhase;
  useSampleRecords: boolean;
  isTestPreview: boolean;
  onTestPhaseChange: (phase: ExamTestPhase) => void;
  onSampleRecordsToggle: () => void;
  onReset: () => void;
};

export default function ExamTestPanel({
  testPhase,
  useSampleRecords,
  isTestPreview,
  onTestPhaseChange,
  onSampleRecordsToggle,
  onReset,
}: Props) {
  return (
    <details className="group overflow-hidden rounded-xl border border-slate-200/80 bg-white/80 dark:border-slate-700 dark:bg-slate-950/50">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-slate-500 dark:text-slate-400">
          <FlaskConical className="h-3.5 w-3.5 text-amber-500" />
          UI 테스트
        </span>
        {isTestPreview ? (
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">미리보기 중</span>
        ) : null}
      </summary>
      <div className="space-y-2 border-t border-slate-100 px-3 py-3 dark:border-slate-800">
        <div className="flex items-center justify-end">
          {isTestPreview ? (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <RotateCcw className="h-3 w-3" />
              초기화
            </button>
          ) : null}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {PHASE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onTestPhaseChange(value)}
              className={cn(
                'rounded-lg border px-2 py-2 text-[10px] font-black transition-colors',
                testPhase === value
                  ? 'border-amber-400 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-200'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-amber-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onSampleRecordsToggle}
          className={cn(
            'w-full rounded-lg border px-3 py-2 text-[11px] font-black transition-colors',
            useSampleRecords
              ? 'border-amber-400 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-200'
              : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
          )}
        >
          샘플 기록 {useSampleRecords ? 'ON' : 'OFF'}
        </button>
      </div>
    </details>
  );
}
