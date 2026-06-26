import Link from 'next/link';
import { Activity } from 'lucide-react';
import type { BackendHealthUptimeSummary } from '@/lib/backend-health';
import { cn } from '@/lib/utils';

const STATUS_STYLE: Record<
  BackendHealthUptimeSummary['status'],
  { badge: string; dot: string; label: string }
> = {
  ok: {
    badge:
      'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    label: '정상',
  },
  degraded: {
    badge:
      'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-300',
    dot: 'bg-amber-400',
    label: '저하',
  },
  down: {
    badge:
      'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/20 dark:border-rose-800/50 dark:text-rose-300',
    dot: 'bg-rose-500',
    label: '장애',
  },
  unknown: {
    badge:
      'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-400',
    dot: 'bg-slate-400',
    label: '수집 중',
  },
};

export default function BackendUptimeBadge({
  summary,
}: {
  summary: BackendHealthUptimeSummary;
}) {
  const style = STATUS_STYLE[summary.status];

  return (
    <Link
      href="/health"
      className={cn(
        'inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black transition-opacity hover:opacity-90',
        style.badge,
      )}
    >
      <Activity className="h-3.5 w-3.5 shrink-0" />
      <span className="inline-flex items-center gap-1.5">
        <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
        백엔드 {summary.days}일
        {summary.uptimePercent != null ? ` ${summary.uptimePercent}%` : ''} · {style.label}
      </span>
    </Link>
  );
}
