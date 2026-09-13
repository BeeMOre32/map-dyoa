'use client';

import Link from 'next/link';
import { BONGNUDO2_PATH, BONGNUDO2_TITLE } from '@/config/bongnudo2';
import {
  bongnudoBandRadiusClass,
  isBongnudoHubLive,
  isBongnudoHubSessionDay,
  type BongnudoBandRole,
} from '@/lib/bongnudo';
import { markModalSoftNav } from '@/lib/modal-navigation';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';

interface BongnudoScheduleChipProps {
  schedule: FlattenedSchedule;
  variant: 'weekly' | 'monthly' | 'mobile';
  bandRole?: BongnudoBandRole | null;
  liveStreamerIds?: Set<string>;
}

export default function BongnudoScheduleChip({
  schedule,
  variant,
  bandRole,
  liveStreamerIds,
}: BongnudoScheduleChipProps) {
  const role = bandRole ?? 'only';
  const isLive = isBongnudoHubLive(schedule, liveStreamerIds);
  const isTodaySession = isBongnudoHubSessionDay(schedule);
  const liveCount = schedule.participants.filter((person) =>
    liveStreamerIds?.has(person.id),
  ).length;
  const showTitle = role === 'only' || role === 'start' || isTodaySession || variant !== 'weekly';

  const onClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    markModalSoftNav();
  };

  const tone = isTodaySession
    ? 'border-indigo-300 bg-indigo-500 shadow-md shadow-indigo-500/30 ring-2 ring-indigo-200 dark:border-indigo-400 dark:bg-indigo-500 dark:ring-indigo-300/70'
    : 'border-indigo-400/70 bg-indigo-600/80 dark:border-indigo-500 dark:bg-indigo-700/80';

  if (variant === 'monthly') {
    return (
      <Link
        href={BONGNUDO2_PATH}
        scroll={false}
        onClick={onClick}
        className={`flex min-w-0 items-center gap-1 border px-1.5 py-1 text-[10px] font-black text-white ${bongnudoBandRadiusClass(role)} ${tone}`}
      >
        <span className="min-w-0 truncate">{showTitle ? BONGNUDO2_TITLE : '·'}</span>
        {isLive ? <LiveDot /> : isTodaySession ? <TodayDot /> : null}
      </Link>
    );
  }

  if (variant === 'mobile') {
    return (
      <Link
        href={BONGNUDO2_PATH}
        scroll={false}
        onClick={onClick}
        className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-white ${tone}`}
      >
        <span className="min-w-0 flex-1 truncate text-sm font-black">{BONGNUDO2_TITLE}</span>
        {isLive ? (
          <span className="shrink-0 text-[10px] font-black">LIVE {liveCount}</span>
        ) : isTodaySession ? (
          <span className="shrink-0 rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-black">
            오늘
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <Link
      href={BONGNUDO2_PATH}
      scroll={false}
      onClick={onClick}
      className={`flex min-h-9 w-full min-w-0 items-center gap-1.5 border-y px-2 py-1.5 text-white ${bongnudoBandRadiusClass(role)} ${
        role === 'only' || role === 'start' ? 'border-l' : 'border-l-0'
      } ${role === 'only' || role === 'end' ? 'border-r' : 'border-r-0'} ${tone}`}
    >
      <span className="min-w-0 truncate text-[11px] font-black">
        {showTitle ? BONGNUDO2_TITLE : ''}
      </span>
      {isLive ? (
        <LiveDot />
      ) : isTodaySession ? (
        <span className="shrink-0 rounded-md bg-white/20 px-1.5 py-px text-[9px] font-black">
          오늘
        </span>
      ) : null}
    </Link>
  );
}

function LiveDot() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-500 px-1.5 py-0.5">
      <span className="h-1 w-1 rounded-full bg-white animate-ping" />
      <span className="text-[9px] font-black text-white">LIVE</span>
    </span>
  );
}

function TodayDot() {
  return (
    <span className="shrink-0 rounded-sm bg-white/25 px-1 text-[8px] font-black">오늘</span>
  );
}
