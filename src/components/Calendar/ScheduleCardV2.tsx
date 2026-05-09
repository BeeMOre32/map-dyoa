'use client';

import { format, isToday } from 'date-fns';
import Link from 'next/link';
import { Clock, Gamepad2, CircleAlert } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';
import { getGameColor } from '@/constants/gamecolor';
import { getStreamerColor } from '@/constants/streamercolor';

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-500/95 rounded-full">
      <span className="w-1 h-1 rounded-full bg-white animate-ping" />
      <span className="text-[9px] font-black text-white tracking-wide">LIVE</span>
    </span>
  );
}

function EndedBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-400 dark:bg-slate-600 rounded-full">
      <span className="w-1 h-1 rounded-full bg-white/80" />
      <span className="text-[9px] font-black text-white tracking-wide">종료</span>
    </span>
  );
}

interface Props {
  schedule: FlattenedSchedule;
  variant: 'weekly' | 'monthly' | 'mobile';
  liveStreamerIds?: Set<string>;
  index?: number;
}

export default function ScheduleCardV2({
  schedule,
  variant,
  liveStreamerIds,
  index = 0,
}: Props) {
  const href = `/calendar/schedule/${schedule.id}`;
  const stopProp = (e: React.MouseEvent) => e.stopPropagation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const isToday_ = isToday(new Date(schedule.startTime));
  const isLive =
    !schedule.isLiveEnded &&
    liveStreamerIds !== undefined &&
    isToday_ &&
    schedule.participants.some((p) => liveStreamerIds.has(p.id));
  const isEnded = schedule.isLiveEnded && isToday_;
  const gameColor = schedule.game ? getGameColor(schedule.game.id, isDark) : null;
  const hasGameTitle = Boolean(schedule.game?.title?.trim());

  // mobile / monthly — same as original
  if (variant === 'mobile') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.045, duration: 0.22, ease: 'easeOut' }}
        whileTap={{ scale: 0.97 }}
      >
        <Link
          href={href}
          scroll={false}
          onClick={stopProp}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border text-sm font-bold transition-shadow"
          style={gameColor ? { backgroundColor: `${gameColor}20`, borderColor: `${gameColor}55`, color: gameColor } : undefined}
        >
          <span className="text-xs opacity-60 shrink-0 font-semibold">
            {schedule.isGuerrilla ? '미정' : format(new Date(schedule.startTime), 'HH:mm')}
          </span>
          <span className="truncate flex-1">{schedule.title}</span>
          {isLive && <LiveBadge />}
          {isEnded && <EndedBadge />}
        </Link>
      </motion.div>
    );
  }

  if (variant === 'monthly') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.04, duration: 0.16, ease: 'easeOut' }}
        whileHover={{ scale: 1.03, transition: { duration: 0.1 } }}
        whileTap={{ scale: 0.96 }}
      >
        <Link href={href} scroll={false} className="block" onClick={stopProp}>
          <div
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded-md border shadow-sm"
            style={gameColor ? { backgroundColor: `${gameColor}25`, borderColor: `${gameColor}55`, color: gameColor } : undefined}
          >
            <span className="opacity-70 shrink-0 font-semibold">
              {schedule.isGuerrilla ? '미정' : format(new Date(schedule.startTime), 'HH:mm')}
            </span>
            <span className="truncate flex-1">{schedule.title}</span>
            {isLive && <LiveBadge />}
          </div>
        </Link>
      </motion.div>
    );
  }

  // weekly — new design
  const cardBg = gameColor
    ? { backgroundColor: `${gameColor}14`, borderColor: `${gameColor}50` }
    : undefined;
  const cardTitleColor = gameColor ?? (isDark ? '#e2e8f0' : '#1e293b');

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2, ease: 'easeOut' }}
      whileHover={{ y: -1, transition: { duration: 0.1 } }}
      whileTap={{ scale: 0.97 }}
    >
      <Link href={href} scroll={false} className="block" onClick={stopProp}>
        <div
          className={`rounded-lg border flex flex-col px-3 py-3 gap-2.5 transition-[box-shadow,transform,border-color] hover:shadow-sm cursor-pointer ${
            gameColor
              ? isLive ? 'shadow-[0_2px_10px_rgba(239,68,68,0.15)]' : ''
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
          style={cardBg}
        >
          {/* 상단 메타: 게임 태그 + 상태 배지 */}
          <div className="flex items-center gap-2 min-w-0">
            {hasGameTitle && schedule.game && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-0 overflow-hidden flex-1"
                style={gameColor
                  ? { backgroundColor: `${gameColor}28`, color: gameColor }
                  : { backgroundColor: 'rgba(245,158,11,0.15)', color: '#b45309' }}
              >
                <Gamepad2 className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">{schedule.game.title}</span>
              </span>
            )}
            {(isLive || isEnded) && (
              <span className="shrink-0 ml-auto">
                {isLive ? <LiveBadge /> : <EndedBadge />}
              </span>
            )}
          </div>

          {/* 시간 / 미정 */}
          {schedule.isGuerrilla ? (
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              <CircleAlert className="w-3 h-3 shrink-0" />
              미정
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <Clock className="w-2.5 h-2.5 shrink-0" />
              {format(new Date(schedule.startTime), 'HH:mm')}
              {schedule.endTime && (
                <span className="opacity-70">→ {format(new Date(schedule.endTime), 'HH:mm')}</span>
              )}
            </div>
          )}

          {/* 제목 */}
          <p className="text-[13px] font-extrabold line-clamp-2 leading-snug" style={{ color: cardTitleColor }}>
            {schedule.title}
          </p>

          {/* 참여 방송인 */}
          {schedule.participants.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {schedule.participants.slice(0, 2).map((p) => {
                const c = getStreamerColor(p.id, isDark) ?? p.colorCode;
                return (
                  <span
                    key={p.id}
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0"
                    style={{ borderColor: `${c}60`, color: c, backgroundColor: `${c}18` }}
                  >
                    {p.name}
                  </span>
                );
              })}
              {schedule.participants.length > 2 && (
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  +{schedule.participants.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
