'use client';

import { useCallback, useState } from 'react';
import { Link2, Check, Share2 } from 'lucide-react';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';
import { absoluteUrl } from '@/lib/site';
import { useToast } from '@/components/Common/Toaster';

type Props = {
  schedule: FlattenedSchedule;
  className?: string;
};

export default function ScheduleShareButton({ schedule, className = '' }: Props) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const shareUrl = absoluteUrl(`/calendar/schedule/${schedule.id}`);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('일정 링크를 복사했습니다.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('링크 복사에 실패했습니다.');
    }
  }, [shareUrl, toast]);

  const nativeShare = useCallback(async () => {
    const memberNames = schedule.participants.map((p) => p.name).join(', ');
    const text = [
      schedule.formattedDate,
      schedule.formattedTime,
      schedule.game?.title,
      memberNames ? `참여: ${memberNames}` : null,
    ]
      .filter(Boolean)
      .join(' · ');

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: schedule.title,
          text,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }
    await copyLink();
  }, [schedule, shareUrl, copyLink]);

  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => void copyLink()}
        className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-700/80"
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-500" />
        ) : (
          <Link2 className="h-4 w-4 text-indigo-500" />
        )}
        {copied ? '복사됨' : '링크 복사'}
      </button>
      <button
        type="button"
        onClick={() => void nativeShare()}
        className="flex items-center justify-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-black text-indigo-600 transition-colors hover:bg-indigo-100 dark:border-indigo-900/40 dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
      >
        <Share2 className="h-4 w-4" />
        공유
      </button>
    </div>
  );
}