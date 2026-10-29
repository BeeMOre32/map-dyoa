'use client';

import { useEffect } from 'react';
import { toast } from '@heroui/react';
import {
  markFeedbackReplySeen,
  readFeedbackReceipts,
} from '@/lib/feedback-receipt-client';

async function pullReplies() {
  const rows = readFeedbackReceipts();
  if (rows.length === 0) return;
  const res = await fetch('/api/feedbacks/replies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      receipts: rows.map((row) => ({ id: row.id, receipt: row.receipt })),
    }),
  });
  if (!res.ok) return;
  const data = (await res.json()) as { replies?: { id: string; reply: string }[] };
  if (!Array.isArray(data.replies)) return;
  for (const item of data.replies) {
    const known = rows.find((row) => row.id === item.id);
    if (!known || !item.reply || known.seenReply === item.reply) continue;
    toast.success('관리자가 답변을 남겼습니다', {
      description: item.reply,
      timeout: 12000,
    });
    markFeedbackReplySeen(item.id, item.reply);
    known.seenReply = item.reply;
  }
}

export default function FeedbackReplyWatcher() {
  useEffect(() => {
    const run = () => {
      void pullReplies().catch(() => undefined);
    };
    run();
    const timer = window.setInterval(run, 60_000);
    window.addEventListener('focus', run);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', run);
    };
  }, []);

  return null;
}
