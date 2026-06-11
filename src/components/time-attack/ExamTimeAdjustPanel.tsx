'use client';

import { useEffect, useState, useTransition } from 'react';
import { Clock } from 'lucide-react';
import { adjustHoi4ExamTimeAction } from '@/app/lab/time-attack/actions';
import type { Hoi4ExamRuntimeState } from '@/lib/hoi4-exam-state';
import {
  formatKstDateTime,
  isoToKstDatetimeLocal,
} from '@/lib/hoi4-exam-time';
import type { ExamPhase } from '@/lib/hoi4GermanExam';
import { cn } from '@/lib/utils';

type Props = {
  phase: ExamPhase;
  runtime: Hoi4ExamRuntimeState;
  onRuntimeChange: (state: Hoi4ExamRuntimeState) => void;
  variant?: 'default' | 'hero';
};

const SECOND_OFFSETS = [-30, -10, -1, 1, 10, 30] as const;
const MINUTE_OFFSETS = [-10, -1, 1, 10] as const;

function formatOffsetLabel(seconds: number): string {
  const abs = Math.abs(seconds);
  if (abs >= 60 && abs % 60 === 0) {
    const minutes = abs / 60;
    return seconds > 0 ? `+${minutes}분` : `−${minutes}분`;
  }
  return seconds > 0 ? `+${seconds}초` : `−${abs}초`;
}

function OffsetButtonRow({
  label,
  disabled,
  secondOffsets,
  minuteOffsets,
  onOffsetSeconds,
}: {
  label?: string;
  disabled: boolean;
  secondOffsets: readonly number[];
  minuteOffsets: readonly number[];
  onOffsetSeconds: (seconds: number) => void;
}) {
  return (
    <div className="space-y-1">
      {label ? (
        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {label}
        </p>
      ) : null}
      <div className="grid grid-cols-6 gap-1">
        {secondOffsets.map((seconds) => (
          <button
            key={`s-${seconds}`}
            type="button"
            disabled={disabled}
            onClick={() => onOffsetSeconds(seconds)}
            className="rounded-lg border border-slate-200 bg-white px-0.5 py-1.5 text-[9px] font-black tabular-nums text-slate-600 transition-colors hover:border-amber-300 hover:text-amber-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-amber-800 dark:hover:text-amber-400"
          >
            {formatOffsetLabel(seconds)}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-1">
        {minuteOffsets.map((minutes) => (
          <button
            key={`m-${minutes}`}
            type="button"
            disabled={disabled}
            onClick={() => onOffsetSeconds(minutes * 60)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-1 py-1.5 text-[10px] font-black tabular-nums text-slate-600 transition-colors hover:border-amber-300 hover:text-amber-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-amber-800 dark:hover:text-amber-400"
          >
            {formatOffsetLabel(minutes * 60)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ExamTimeAdjustPanel({
  phase,
  runtime,
  onRuntimeChange,
  variant = 'default',
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [startLocal, setStartLocal] = useState('');
  const [endLocal, setEndLocal] = useState('');

  const canAdjust = Boolean(runtime.manualStartedAt);
  const showEnd = phase === 'after' && Boolean(runtime.manualEndedAt);
  const isHero = variant === 'hero';

  useEffect(() => {
    if (runtime.manualStartedAt) {
      setStartLocal(isoToKstDatetimeLocal(runtime.manualStartedAt));
    }
    if (runtime.manualEndedAt) {
      setEndLocal(isoToKstDatetimeLocal(runtime.manualEndedAt));
    }
  }, [runtime.manualStartedAt, runtime.manualEndedAt]);

  if (!canAdjust) return null;

  const apply = (input: Parameters<typeof adjustHoi4ExamTimeAction>[0]) => {
    setError(null);
    startTransition(async () => {
      const result = await adjustHoi4ExamTimeAction(input);
      if (!result.success) {
        setError(result.error);
        return;
      }
      onRuntimeChange(result.data);
    });
  };

  const applyStartAbsolute = () => {
    if (!startLocal.trim()) return;
    apply({ manualStartedAtKst: startLocal });
  };

  const applyEndAbsolute = () => {
    if (!endLocal.trim()) return;
    apply({ manualEndedAtKst: endLocal });
  };

  return (
    <details className="group mt-2 overflow-hidden rounded-xl border border-slate-200/80 bg-white/60 dark:border-slate-700 dark:bg-slate-950/40">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 marker:content-none [&::-webkit-details-marker]:hidden">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-[11px] font-black',
            isHero
              ? 'text-slate-600 dark:text-slate-300'
              : 'text-violet-700 dark:text-violet-300',
          )}
        >
          <Clock className="h-3.5 w-3.5 text-amber-500" />
          시간 보정
        </span>
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
          출발 {runtime.manualStartedAt ? formatKstDateTime(runtime.manualStartedAt) : '—'}
        </span>
      </summary>

      <div className="space-y-3 border-t border-slate-100 px-3 py-3 dark:border-slate-800">
        <div className="space-y-1.5">
          <p className="text-[10px] font-black text-slate-500 dark:text-slate-400">
            출발 시각 (경과 타이머 기준)
          </p>
          <OffsetButtonRow
            label="초 · 분"
            disabled={pending}
            secondOffsets={SECOND_OFFSETS}
            minuteOffsets={MINUTE_OFFSETS}
            onOffsetSeconds={(seconds) => apply({ startOffsetSeconds: seconds })}
          />
          <div className="flex gap-1.5">
            <input
              type="datetime-local"
              step={1}
              value={startLocal}
              onChange={(event) => setStartLocal(event.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold tabular-nums text-slate-800 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="button"
              disabled={pending || !startLocal}
              onClick={applyStartAbsolute}
              className="shrink-0 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-[10px] font-black text-amber-800 disabled:opacity-40 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
            >
              적용
            </button>
          </div>
        </div>

        {showEnd ? (
          <div className="space-y-1.5">
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400">
              종료 시각
            </p>
            <OffsetButtonRow
              label="초 · 분"
              disabled={pending}
              secondOffsets={SECOND_OFFSETS}
              minuteOffsets={MINUTE_OFFSETS}
              onOffsetSeconds={(seconds) => apply({ endOffsetSeconds: seconds })}
            />
            <div className="flex gap-1.5">
              <input
                type="datetime-local"
                step={1}
                value={endLocal}
                onChange={(event) => setEndLocal(event.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold tabular-nums text-slate-800 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                disabled={pending || !endLocal}
                onClick={applyEndAbsolute}
                className="shrink-0 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-[10px] font-black text-amber-800 disabled:opacity-40 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
              >
                적용
              </button>
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="text-[10px] font-bold text-red-600 dark:text-red-400">{error}</p>
        ) : (
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
            초 단위로 미세 보정하거나, 직접 시각(초 포함)을 입력할 수 있습니다.
          </p>
        )}
      </div>
    </details>
  );
}
