'use client';

import { useEffect, useState, useTransition } from 'react';
import { Pencil, X } from 'lucide-react';
import {
  deleteHoi4ExamEntryAction,
  upsertHoi4ExamEntryAction,
} from '@/app/lab/time-attack/actions';
import type { Hoi4GermanExamEntry } from '@/config/hoi4GermanExam2026';
import type { ExamLeaderboardRow } from '@/lib/hoi4GermanExam';
import { playTimePartsFromMs } from '@/lib/hoi4-exam-entries';
import { shiftPlayTimeParts } from '@/lib/hoi4-exam-time';
import { useScrollLock } from '@/hooks/useScrollLock';
import StreamerAvatar from '@/components/streamer/StreamerAvatar';
import { getStreamerImagePath } from '@/lib/utils';

type Props = {
  examId: string;
  row: ExamLeaderboardRow;
  entry: Hoi4GermanExamEntry | undefined;
  onClose: () => void;
  onSaved: (entries: Hoi4GermanExamEntry[]) => void;
};

export default function ExamEntryEditModal({
  examId,
  row,
  entry,
  onClose,
  onSaved,
}: Props) {
  useScrollLock();

  const initialParts = playTimePartsFromMs(entry?.playTimeMs);
  const [clearGameDate, setClearGameDate] = useState(entry?.clearGameDate ?? '');
  const [playHours, setPlayHours] = useState(String(initialParts.hours));
  const [playMinutes, setPlayMinutes] = useState(String(initialParts.minutes));
  const [playSeconds, setPlaySeconds] = useState(String(initialParts.seconds));
  const [clearedAtKst, setClearedAtKst] = useState(entry?.clearedAtKst ?? '');
  const [vodUrl, setVodUrl] = useState(entry?.vodUrl ?? '');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const shiftPlayTime = (deltaSeconds: number) => {
    const next = shiftPlayTimeParts(
      Number(playHours) || 0,
      Number(playMinutes) || 0,
      Number(playSeconds) || 0,
      deltaSeconds,
    );
    setPlayHours(String(next.hours));
    setPlayMinutes(String(next.minutes));
    setPlaySeconds(String(next.seconds));
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await upsertHoi4ExamEntryAction(examId, {
        streamerId: row.streamerId,
        clearGameDate,
        playHours: Number(playHours) || 0,
        playMinutes: Number(playMinutes) || 0,
        playSeconds: Number(playSeconds) || 0,
        clearedAtKst: clearedAtKst || undefined,
        vodUrl: vodUrl || undefined,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      if (!result.data) {
        setError('저장에 실패했습니다.');
        return;
      }
      onSaved(result.data);
      onClose();
    });
  };

  const remove = () => {
    if (!entry?.clearGameDate) {
      onClose();
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteHoi4ExamEntryAction(examId, row.streamerId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      if (!result.data) {
        setError('삭제에 실패했습니다.');
        return;
      }
      onSaved(result.data);
      onClose();
    });
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <StreamerAvatar
              name={row.name}
              imgSrc={row.profileImg ?? getStreamerImagePath(row.name)}
              colorCode={row.colorCode}
              streamerId={row.streamerId}
              size="small"
            />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-black text-slate-800 dark:text-slate-100">
                <Pencil className="h-3.5 w-3.5 text-amber-500" />
                클리어 기록
              </p>
              <p className="truncate text-xs font-bold text-slate-500 dark:text-slate-400">
                {row.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">
              게임 날짜 (STOP 시점)
            </span>
            <input
              type="text"
              value={clearGameDate}
              onChange={(event) => setClearGameDate(event.target.value)}
              placeholder="1941-08-04"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>

          <div className="grid grid-cols-3 gap-2">
            <label className="block space-y-1">
              <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">
                시
              </span>
              <input
                type="number"
                min={0}
                value={playHours}
                onChange={(event) => setPlayHours(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold tabular-nums text-slate-800 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">
                분
              </span>
              <input
                type="number"
                min={0}
                max={59}
                value={playMinutes}
                onChange={(event) => setPlayMinutes(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold tabular-nums text-slate-800 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">
                초
              </span>
              <input
                type="number"
                min={0}
                max={59}
                value={playSeconds}
                onChange={(event) => setPlaySeconds(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold tabular-nums text-slate-800 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>
          </div>

          <div className="grid grid-cols-6 gap-1">
            {([-30, -10, -1, 1, 10, 30] as const).map((seconds) => (
              <button
                key={`s-${seconds}`}
                type="button"
                onClick={() => shiftPlayTime(seconds)}
                className="rounded-lg border border-slate-200 bg-white px-0.5 py-1 text-[9px] font-black tabular-nums text-slate-600 hover:border-amber-300 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-amber-800 dark:hover:text-amber-400"
              >
                {seconds > 0 ? `+${seconds}초` : `${seconds}초`}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-1">
            {([-10, -1, 1, 10] as const).map((minutes) => (
              <button
                key={`m-${minutes}`}
                type="button"
                onClick={() => shiftPlayTime(minutes * 60)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-1 py-1 text-[10px] font-black tabular-nums text-slate-600 hover:border-amber-300 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-amber-800 dark:hover:text-amber-400"
              >
                {minutes > 0 ? `+${minutes}분` : `${minutes}분`}
              </button>
            ))}
          </div>

          <label className="block space-y-1">
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">
              클리어 시각 KST (선택)
            </span>
            <input
              type="text"
              value={clearedAtKst}
              onChange={(event) => setClearedAtKst(event.target.value)}
              placeholder="21:18"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold tabular-nums text-slate-800 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">
              VOD URL (선택)
            </span>
            <input
              type="url"
              value={vodUrl}
              onChange={(event) => setVodUrl(event.target.value)}
              placeholder="https://chzzk.naver.com/..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>
        </div>

        {error ? (
          <p className="mt-3 text-xs font-bold text-red-600 dark:text-red-400">{error}</p>
        ) : null}

        <div className="mt-4 flex gap-2">
          {entry?.clearGameDate ? (
            <button
              type="button"
              disabled={pending}
              onClick={remove}
              className="rounded-xl border border-red-200 px-3 py-2.5 text-xs font-black text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              삭제
            </button>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            취소
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={submit}
            className="flex-1 rounded-xl bg-amber-500 px-3 py-2.5 text-xs font-black text-white hover:bg-amber-600 disabled:opacity-50"
          >
            {pending ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
