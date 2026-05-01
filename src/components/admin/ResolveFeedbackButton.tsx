'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { resolveFeedbackAction } from '@/app/actions';

export default function ResolveFeedbackButton({
  feedbackId,
  resolved,
}: {
  feedbackId: string;
  resolved: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(resolved);

  const handleClick = async () => {
    if (done || pending) return;
    setPending(true);
    const result = await resolveFeedbackAction(feedbackId);
    if (result.success) setDone(true);
    setPending(false);
  };

  if (done) {
    return (
      <div className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black">
        <CheckCircle2 className="w-3.5 h-3.5" /> 처리 완료
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="px-5 py-2.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors disabled:opacity-50"
    >
      {pending ? '처리 중...' : '처리 완료하기'}
    </button>
  );
}
