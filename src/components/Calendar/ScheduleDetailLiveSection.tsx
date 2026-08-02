'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, LayoutGrid, Radio } from 'lucide-react';
import Link from 'next/link';
import type { FlattenedSchedule, ParticipantFlat } from '@/lib/schedule-formatters';
import { getScheduleLiveParticipants } from '@/lib/schedule-live';
import { useLiveStatus } from '@/hooks/useLiveStatus';
import { useMinuteClock } from '@/hooks/useMinuteClock';
import { getStreamerColor } from '@/constants/streamercolor';
import { getStreamerImagePath } from '@/lib/utils';
import { getChannelUrl } from '@/components/multiview/utils';
import {
  claimLiveEmbed,
  releaseLiveEmbed,
} from '@/lib/streamer-live-preview';
import StreamerLiveEmbed from '@/components/streamer/StreamerLiveEmbed';

type Props = {
  schedule: FlattenedSchedule;
  isDark: boolean;
};

function Avatar({
  participant,
  isDark,
}: {
  participant: ParticipantFlat;
  isDark: boolean;
}) {
  const color = getStreamerColor(participant.id, isDark) ?? participant.colorCode;
  const src = getStreamerImagePath(participant.name);
  return (
    <span
      className="h-6 w-6 shrink-0 overflow-hidden rounded-full"
      style={{ backgroundColor: color }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover"
        onError={(e) => {
          e.currentTarget.src = '/images/default-avatar.svg';
        }}
      />
    </span>
  );
}

/** 사이드패널 LIVE 탭용 미리보기 */
export default function ScheduleDetailLiveSection({ schedule, isDark }: Props) {
  useMinuteClock();
  const { liveIds } = useLiveStatus();
  const liveParticipants = useMemo(
    () => getScheduleLiveParticipants(schedule, liveIds),
    [schedule, liveIds],
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [liveTitle, setLiveTitle] = useState<string | null>(null);
  /** 호버가 같은/다른 스트림을 가져가면 iframe 내리고 복구 CTA */
  const [embedHeld, setEmbedHeld] = useState(true);

  useEffect(() => {
    if (liveParticipants.length === 0) {
      setActiveId(null);
      return;
    }
    setActiveId((prev) =>
      prev && liveParticipants.some((p) => p.id === prev)
        ? prev
        : liveParticipants[0]!.id,
    );
  }, [liveParticipants]);

  const active =
    liveParticipants.find((p) => p.id === activeId) ?? liveParticipants[0] ?? null;

  const reclaimEmbed = useCallback((streamerId: string) => {
    setEmbedHeld(true);
    claimLiveEmbed(streamerId, 'detail', () => setEmbedHeld(false));
  }, []);

  // 호버 미리보기와 iframe 중복 방지 — 상세가 스트림을 점유
  useEffect(() => {
    if (!active) return;
    const id = active.id;
    reclaimEmbed(id);
    return () => {
      releaseLiveEmbed(id, 'detail');
    };
  }, [active?.id, reclaimEmbed]);

  const onMeta = useCallback(
    (meta: { title: string | null; category: string | null }) => {
      setLiveTitle(meta.title);
    },
    [],
  );

  if (!active) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
        <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-700/50">
          <Radio className="h-8 w-8 text-slate-300 dark:text-slate-600" />
        </div>
        <p className="text-sm font-black text-slate-500 dark:text-slate-400">
          지금 라이브인 참가자가 없어요
        </p>
      </div>
    );
  }

  const channelUrl = getChannelUrl(active);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 overflow-hidden bg-black">
        {embedHeld ? (
          <StreamerLiveEmbed
            key={active.id}
            streamer={active}
            onMeta={onMeta}
          />
        ) : (
          <button
            type="button"
            onClick={() => reclaimEmbed(active.id)}
            className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-[#0e0e10] px-4 text-center transition-colors hover:bg-slate-900"
          >
            <p className="text-xs font-bold text-white/60">
              멤버 탭 미리보기로 전환됨
            </p>
            <span className="rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-black text-white">
              여기서 다시 보기
            </span>
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-y-contain p-3 custom-scrollbar">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-black tracking-wide text-white">
              LIVE
            </span>
            <p className="truncate text-sm font-black text-slate-800 dark:text-white">
              {active.name}
            </p>
          </div>
          {liveTitle ? (
            <p
              className="line-clamp-2 text-[12px] font-bold leading-snug text-slate-500 dark:text-slate-400"
              title={liveTitle}
            >
              {liveTitle}
            </p>
          ) : null}
        </div>

        {liveParticipants.length > 1 ? (
          <div className="flex flex-wrap gap-1.5">
            {liveParticipants.map((p) => {
              const selected = p.id === active.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActiveId(p.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-2.5 text-[11px] font-bold transition-all ${
                    selected
                      ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-300'
                  }`}
                >
                  <Avatar participant={p} isDark={isDark} />
                  {p.name}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            치지직에서 열기
          </a>
          {schedule.participants.length >= 2 ? (
            <Link
              href={`/calendar/schedule/${schedule.id}/multiview`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2.5 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-100 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-400 dark:hover:bg-indigo-950/50"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              멀티뷰로 함께 보기
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
