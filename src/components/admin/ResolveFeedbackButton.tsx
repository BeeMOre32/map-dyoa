'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { resolveFeedbackAction, rejectFeedbackAction, replyFeedbackAction } from '@/app/actions';

type Status = 'PENDING' | 'RESOLVED' | 'REJECTED';

export default function ResolveFeedbackButton({
  feedbackId,
  initialStatus,
  initialReply,
}: {
  feedbackId: string;
  initialStatus: Status;
  initialReply?: string | null;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [pending, setPending] = useState(false);
  const [reply, setReply] = useState(initialReply ?? '');
  const [replyPending, setReplyPending] = useState(false);
  const [replyNote, setReplyNote] = useState<string | null>(null);

  const act = async (action: 'resolve' | 'reject') => {
    if (status !== 'PENDING' || pending) return;
    setPending(true);
    const result = action === 'resolve'
      ? await resolveFeedbackAction(feedbackId)
      : await rejectFeedbackAction(feedbackId);
    if (result.success) setStatus(action === 'resolve' ? 'RESOLVED' : 'REJECTED');
    setPending(false);
  };

  const sendReply = async () => {
    if (replyPending) return;
    setReplyPending(true);
    setReplyNote(null);
    const result = await replyFeedbackAction(feedbackId, reply);
    setReplyNote(result.success ? '답변을 남겼습니다.' : result.error);
    setReplyPending(false);
  };

  const replyBox = (
    <div className="flex w-56 flex-col gap-2">
      <textarea
        value={reply}
        maxLength={500}
        onChange={(event) => setReply(event.target.value)}
        placeholder="관리자 답변"
        className="min-h-20 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
      />
      <button
        type="button"
        onClick={sendReply}
        disabled={replyPending || reply.trim().length === 0}
        className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50"
      >
        {replyPending ? '남기는 중...' : '답변 남기기'}
      </button>
      {replyNote ? <p className="text-[11px] font-bold text-slate-500">{replyNote}</p> : null}
    </div>
  );

  if (status === 'RESOLVED') {
    return (
      <div className="flex flex-col gap-2">
        {replyBox}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black">
          <CheckCircle2 className="w-3.5 h-3.5" /> 처리 완료
        </div>
      </div>
    );
  }

  if (status === 'REJECTED') {
    return (
      <div className="flex flex-col gap-2">
        {replyBox}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-400 dark:text-red-400 rounded-xl text-xs font-black">
          <XCircle className="w-3.5 h-3.5" /> 거절됨
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {replyBox}
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
