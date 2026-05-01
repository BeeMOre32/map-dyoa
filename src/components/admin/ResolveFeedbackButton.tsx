'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { resolveFeedbackAction, rejectFeedbackAction } from '@/app/actions';

type Status = 'PENDING' | 'RESOLVED' | 'REJECTED';

export default function ResolveFeedbackButton({
  feedbackId,
  initialStatus,
}: {
  feedbackId: string;
  initialStatus: Status;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [pending, setPending] = useState(false);

  const act = async (action: 'resolve' | 'reject') => {
    if (status !== 'PENDING' || pending) return;
    setPending(true);
    const result = action === 'resolve'
      ? await resolveFeedbackAction(feedbackId)
      : await rejectFeedbackAction(feedbackId);
    if (result.success) setStatus(action === 'resolve' ? 'RESOLVED' : 'REJECTED');
    setPending(false);
  };

  if (status === 'RESOLVED') {
    return (
      <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black">
        <CheckCircle2 className="w-3.5 h-3.5" /> 처리 완료
      </div>
    );
  }

  if (status === 'REJECTED') {
    return (
      <div className="flex items-center gap-1.5 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-400 dark:text-red-400 rounded-xl text-xs font-black">
        <XCircle className="w-3.5 h-3.5" /> 거절됨
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => act('resolve')}
        disabled={pending}
        className="px-4 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {pending ? '처리 중...' : '처리 완료'}
      </button>
      <button
        onClick={() => act('reject')}
        disabled={pending}
        className="px-4 py-2 bg-white dark:bg-slate-800 text-red-400 border border-red-200 dark:border-red-800 rounded-xl text-xs font-black hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
      >
        거절
      </button>
    </div>
  );
}
