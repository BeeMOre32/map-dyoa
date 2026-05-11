'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Check, Copy, Loader2, RotateCcw, Send } from 'lucide-react';
import { useToast } from '@/components/Common/Toaster';
import {
  buildErrorReportClipboardText,
  extractBackendRequestIdFromMessage,
  newIncidentReferenceId,
} from '@/lib/error-report';

const ERROR_FEEDBACK_CATEGORY = '사이트 오류·에러 제보';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
  /** 루트 global-error처럼 레이아웃 밖에서 쓸 때 */
  variant?: 'embedded' | 'fullscreen';
};

export default function ErrorReportPanel({ error, reset, variant = 'embedded' }: Props) {
  const toast = useToast();
  const [incidentId] = useState(newIncidentReferenceId);
  const [copied, setCopied] = useState(false);
  const [extraNote, setExtraNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const backendRequestId = extractBackendRequestIdFromMessage(error.message);
  const digest = error.digest ?? null;

  const reportText = useMemo(() => {
    let pageUrl: string | null = null;
    if (typeof window !== 'undefined') {
      try {
        pageUrl = window.location.href;
      } catch {
        pageUrl = null;
      }
    }
    return buildErrorReportClipboardText({
      incidentId,
      digest,
      backendRequestId,
      errorMessage: error.message,
      errorStack: error.stack ?? null,
      pageUrl,
    });
  }, [incidentId, digest, backendRequestId, error.message, error.stack]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const submitToAdmin = async () => {
    const note = extraNote.trim();
    const combined = note ? `${reportText}\n\n--- 추가 메모 ---\n${note}` : reportText;
    const contentOut = combined.length > 5000 ? combined.slice(0, 5000) : combined;
    setSubmitting(true);
    try {
      // 에러 경계에서는 서버 액션이 끊기는 경우가 있어, 동일 출처 API로 전송
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: ERROR_FEEDBACK_CATEGORY,
          content: contentOut,
          type: 'ERROR_REPORT',
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? `전송 실패 (HTTP ${res.status})`);
        return;
      }
      toast.success('관리자에게 전달되었습니다. 피드백 목록에서 확인할 수 있습니다.');
      setExtraNote('');
    } catch {
      toast.error('전송 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const shell =
    variant === 'fullscreen'
      ? 'min-h-dvh w-full bg-slate-100 dark:bg-slate-950 p-6 flex flex-col items-center justify-center'
      : 'flex flex-col items-center justify-center flex-1 p-8 text-center gap-6';

  return (
    <div className={shell}>
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-800 dark:text-white">
              문제가 발생했습니다
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
              <strong className="text-slate-700 dark:text-slate-200">관리자에게 보내기</strong> 버튼으로
              이 화면의 오류 정보를 그대로 접수할 수 있습니다. 참조 번호를 따로 복사해 보내셔도 됩니다.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3 text-left">
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">
            제보 참조 번호
          </p>
          <p className="font-mono text-sm font-bold text-indigo-700 dark:text-indigo-300 break-all">
            {incidentId}
          </p>
          {digest ? (
            <>
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500 pt-1">
                Next digest
              </p>
              <p className="font-mono text-xs text-slate-600 dark:text-slate-300 break-all">{digest}</p>
            </>
          ) : null}
          {backendRequestId ? (
            <>
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500 pt-1">
                백엔드 requestId
              </p>
              <p className="font-mono text-xs text-sky-700 dark:text-sky-300 break-all">{backendRequestId}</p>
            </>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">
            추가 메모 (선택)
          </label>
          <textarea
            value={extraNote}
            onChange={(e) => setExtraNote(e.target.value)}
            disabled={submitting}
            rows={2}
            placeholder="재현 방법 등을 적어 주세요."
            className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 disabled:opacity-50"
          />
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => void submitToAdmin()}
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-indigo-600 text-sm font-black text-white shadow-lg shadow-indigo-300/40 transition hover:bg-indigo-700 disabled:opacity-50 dark:shadow-indigo-950/40"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            관리자에게 보내기 (피드백 접수)
          </button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={copy}
              className="inline-flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? '복사됨' : '제보용 텍스트만 복사'}
            </button>
            <button
              type="button"
              onClick={() => reset()}
              disabled={submitting}
              className="inline-flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-100 text-sm font-bold text-slate-800 hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              다시 시도
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          <Link href="/help" className="font-bold text-indigo-600 dark:text-indigo-400 underline underline-offset-2">
            도움말
          </Link>
          에서 다른 안내를 볼 수 있습니다.
        </p>
      </div>
    </div>
  );
}
