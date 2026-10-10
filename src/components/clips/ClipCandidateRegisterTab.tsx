'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import {
  dismissClipCandidateAction,
  listClipCandidatesAction,
  refreshClipCandidatesAction,
  registerClipCandidateAction,
} from '@/app/clips/candidate-actions';
import {
  CLIP_CANDIDATE_MIN_READ_COUNT,
  CLIP_CANDIDATE_WINDOW_DAYS,
  type ClipCandidateView,
} from '@/lib/clip-candidate-policy';

const SCAN_COOLDOWN_KEY = 'clip-candidates:last-scan';
const SCAN_COOLDOWN_MS = 3 * 60_000;

function canScanNow(): boolean {
  try {
    const raw = localStorage.getItem(SCAN_COOLDOWN_KEY);
    if (!raw) return true;
    return Date.now() - Number(raw) >= SCAN_COOLDOWN_MS;
  } catch {
    return true;
  }
}

function markScanned() {
  try {
    localStorage.setItem(SCAN_COOLDOWN_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

function formatWhen(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  return format(d, 'M/d HH:mm', { locale: ko });
}

export default function ClipCandidateRegisterTab() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<ClipCandidateView[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<'ok' | 'err'>('ok');
  const [busyId, setBusyId] = useState<string | null>(null);

  const apply = useCallback((rows: ClipCandidateView[]) => {
    setCandidates(rows);
    setTitles((prev) => {
      const next = { ...prev };
      for (const row of rows) {
        if (next[row.id] == null) next[row.id] = row.title;
      }
      return next;
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listClipCandidatesAction();
      if (!res.success) {
        setMessageTone('err');
        setMessage(res.error ?? '후보를 불러오지 못했습니다.');
        setCandidates([]);
        return;
      }
      apply(res.data.candidates);
    } catch {
      setMessageTone('err');
      setMessage('후보를 불러오지 못했습니다.');
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [apply]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = (withScan: boolean) => {
    setMessage(null);
    startTransition(async () => {
      const shouldScan = withScan && canScanNow();
      const res = await refreshClipCandidatesAction({ scan: shouldScan });
      if (!res.success) {
        setMessageTone('err');
        setMessage(res.error ?? '새로고침에 실패했습니다.');
        return;
      }
      if (res.data.scanned) {
        markScanned();
        setMessageTone('ok');
        setMessage(
          res.data.created > 0
            ? `새 후보 ${res.data.created}건을 가져왔습니다.`
            : '새 후보는 없습니다. 최근 14일 · 조회 1,000 이상만 모읍니다.',
        );
      } else if (withScan) {
        setMessageTone('ok');
        setMessage('잠시 전에 이미 불러왔습니다. 목록만 다시 열었습니다.');
      }
      apply(res.data.candidates);
    });
  };

  const register = (row: ClipCandidateView) => {
    setBusyId(row.id);
    setMessage(null);
    startTransition(async () => {
      const res = await registerClipCandidateAction(row.id, titles[row.id] ?? row.title);
      setBusyId(null);
      if (!res.success) {
        setMessageTone('err');
        setMessage(res.error ?? '등록에 실패했습니다.');
        if (res.errorCode === 'ALREADY_RESOLVED') void load();
        return;
      }
      setCandidates((prev) => prev.filter((c) => c.id !== row.id));
      setMessageTone('ok');
      setMessage('클립으로 등록했습니다.');
      router.refresh();
    });
  };

  const dismiss = (id: string) => {
    setBusyId(id);
    setMessage(null);
    startTransition(async () => {
      const res = await dismissClipCandidateAction(id);
      setBusyId(null);
      if (!res.success) {
        setMessageTone('err');
        setMessage(res.error ?? '거절에 실패했습니다.');
        if (res.errorCode === 'ALREADY_RESOLVED') void load();
        return;
      }
      setCandidates((prev) => prev.filter((c) => c.id !== id));
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-6">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          최근 {CLIP_CANDIDATE_WINDOW_DAYS}일 · 조회{' '}
          {CLIP_CANDIDATE_MIN_READ_COUNT.toLocaleString('ko-KR')} 이상. 등록하면 해당
          스트리머만 연결됩니다.
        </p>
        <button
          type="button"
          onClick={() => refresh(true)}
          disabled={pending || loading}
          className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          불러오기
        </button>
      </div>

      {message && (
        <p
          className={`mx-4 mt-3 rounded-2xl px-3 py-2 text-xs font-bold sm:mx-6 ${
            messageTone === 'err'
              ? 'bg-red-50 text-red-500 dark:bg-red-900/20'
              : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20'
          }`}
        >
          {message}
        </p>
      )}

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center py-16 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : candidates.length === 0 ? (
          <p className="py-16 text-center text-sm font-bold text-slate-400">
            대기 중인 후보가 없습니다.
          </p>
        ) : (
          candidates.map((row) => (
            <article
              key={row.id}
              className="rounded-2xl border border-slate-200 p-3 dark:border-slate-700"
            >
              <div className="flex gap-3">
                {row.thumbnailUrl ? (
                  <img
                    src={row.thumbnailUrl}
                    alt=""
                    className="h-16 w-28 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="h-16 w-28 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800" />
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <input
                    value={titles[row.id] ?? row.title}
                    onChange={(e) =>
                      setTitles((prev) => ({ ...prev, [row.id]: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {row.streamerName} · 조회 {row.readCount.toLocaleString('ko-KR')}
                    {row.clipDate ? ` · ${formatWhen(row.clipDate)}` : ''}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <a
                  href={row.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mr-auto inline-flex items-center gap-1 text-[11px] font-black text-slate-400 hover:text-indigo-500"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  치지직
                </a>
                <button
                  type="button"
                  disabled={pending || busyId === row.id}
                  onClick={() => dismiss(row.id)}
                  className="rounded-xl px-3 py-2 text-xs font-black text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
                >
                  거절
                </button>
                <button
                  type="button"
                  disabled={pending || busyId === row.id}
                  onClick={() => register(row)}
                  className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-black text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {busyId === row.id ? '처리 중' : '등록'}
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
