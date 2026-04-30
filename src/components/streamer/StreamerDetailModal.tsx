'use client';

import { motion } from 'framer-motion';
import {
  X,
  ExternalLink,
  CalendarDays,
  Clapperboard,
  FileText,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';
import { backdropVariants, smoothModalVariants } from '@/lib/modalVariants';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import StreamerAvatar from './StreamerAvatar';
import { getStreamerImagePath } from '@/lib/utils';
import { getStreamerColor } from '@/constants/streamercolor';
import { getGameColor } from '@/constants/gamecolor';
import type { Streamer } from '@prisma/client';

type ScheduleWithDetails = {
  id: string;
  title: string;
  startTime: Date | string;
  game: { id: string; title: string; isHoi4: boolean } | null;
  participants: {
    streamer: { id: string; name: string; colorCode: string };
    nation?: string | null;
    result?: string | null;
  }[];
};

interface StreamerDetailModalProps {
  streamer: Streamer;
  schedules?: ScheduleWithDetails[];
  scheduleCount?: number;
  clipCount?: number;
}

export default function StreamerDetailModal({
  streamer,
  schedules = [],
  scheduleCount = 0,
  clipCount = 0,
}: StreamerDetailModalProps) {
  const router = useRouter();
  const imgSrc = getStreamerImagePath(streamer.name);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const streamerColor = getStreamerColor(streamer.id, isDark) ?? streamer.colorCode;

  const recentSchedules = schedules.slice(0, 5);

  useEscapeKey(() => router.back());

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={backdropVariants}
      className="fixed inset-0 z-100 flex items-center justify-center p-4 md:p-8 bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-xl"
      onClick={() => router.back()}
    >
      <motion.div
        variants={smoothModalVariants}
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl dark:shadow-slate-900/60 overflow-hidden flex flex-col max-h-[90dvh] border border-slate-100 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 히어로 배너 ── */}
        <div
          className="relative h-28 shrink-0"
          style={{
            background: `linear-gradient(135deg, ${streamerColor}CC 0%, ${streamerColor}44 100%)`,
          }}
        >
          <button
            onClick={() => router.back()}
            className="absolute top-4 right-4 p-2 bg-black/15 hover:bg-black/30 text-white rounded-full backdrop-blur-sm transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 아바타 — 배너 아래로 겹침 */}
          <div className="absolute -bottom-10 left-8">
            <div
              className="rounded-[1.25rem] shadow-xl ring-4"
              style={{ '--tw-ring-color': isDark ? '#0f172a' : '#ffffff' } as React.CSSProperties}
            >
              <div className="ring-4 ring-white dark:ring-slate-900 rounded-[1.25rem]">
                <StreamerAvatar
                  size="large"
                  colorCode={streamer.colorCode}
                  name={streamer.name}
                  imgSrc={imgSrc}
                  streamerId={streamer.id}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── 프로필 헤더 ── */}
        <div className="px-8 pt-14 pb-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight truncate">
                {streamer.name}
              </h2>
              <div className="flex items-center gap-1.5 flex-wrap">
                {streamer.generation > 0 && (
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {streamer.generation}기
                  </span>
                )}
                {streamer.role && (
                  <span
                    className="text-xs font-black px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: `${streamerColor}20`,
                      color: streamerColor,
                    }}
                  >
                    {streamer.role}
                  </span>
                )}
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {streamer.platform}
                </span>
              </div>
            </div>

            {/* 스탯 */}
            <div className="flex items-center gap-6 shrink-0">
              <div className="text-center">
                <p className="text-2xl font-black" style={{ color: streamerColor }}>
                  {scheduleCount}
                </p>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                  방송
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black" style={{ color: streamerColor }}>
                  {clipCount}
                </p>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                  클립
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 스크롤 본문 ── */}
        <div className="overflow-y-auto flex-1 min-h-0 custom-scrollbar">
          <div className="p-8 space-y-8">

            {/* 자기소개 */}
            {streamer.bio && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                  <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                    자기소개
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {streamer.bio}
                </p>
              </section>
            )}

            {/* 참여한 합방 */}
            {recentSchedules.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                  <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                    참여한 합방
                  </span>
                </div>
                <div className="space-y-2">
                  {recentSchedules.map((s) => {
                    const gameColor = s.game ? getGameColor(s.game.id, isDark) : null;
                    const myEntry = s.participants.find((p) => p.streamer.id === streamer.id);
                    const resultLabel: Record<string, string> = { WIN: '승', LOSE: '패', DNF: '미완' };
                    const resultStyle: Record<string, string> = {
                      WIN: 'bg-emerald-500 text-white',
                      LOSE: 'bg-red-500 text-white',
                      DNF: 'bg-slate-400 text-white',
                    };
                    return (
                      <Link
                        key={s.id}
                        href={`/calendar/schedule/${s.id}`}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-indigo-200 dark:hover:border-indigo-700 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 transition-all group"
                      >
                        <div className="shrink-0 w-10 text-center">
                          <p className="text-xs font-black text-slate-400 dark:text-slate-500">
                            {format(new Date(s.startTime), 'M/d', { locale: ko })}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {s.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {s.game && (
                              <p className="text-[10px] font-bold" style={{ color: gameColor ?? '#94a3b8' }}>
                                {s.game.title}
                              </p>
                            )}
                            {s.game?.isHoi4 && myEntry?.nation && (
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                · {myEntry.nation}
                              </span>
                            )}
                            {s.game?.isHoi4 && myEntry?.result && (
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none ${resultStyle[myEntry.result] ?? 'bg-slate-400 text-white'}`}>
                                {resultLabel[myEntry.result] ?? myEntry.result}
                              </span>
                            )}
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 데이터 없을 때 */}
            {schedules.length === 0 && !streamer.bio && (
              <div className="py-16 text-center">
                <Clapperboard className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500">
                  아직 등록된 방송 이력이 없어요
                </p>
              </div>
            )}

          </div>
        </div>

        {/* ── 하단 버튼 ── */}
        <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
          <button
            onClick={() => router.back()}
            className="flex-1 py-3.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            돌아가기
          </button>
          {streamer.chzzkUrl && (
            <a
              href={streamer.chzzkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3.5 text-white rounded-2xl font-black transition-all shadow-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-95"
              style={{ backgroundColor: streamerColor }}
            >
              채널 방문
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
