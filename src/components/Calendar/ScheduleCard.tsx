'use client';

import { format, isToday } from 'date-fns';
import Link from 'next/link';
import { Clock, Gamepad2, Zap } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';
import { getGameColor } from '@/constants/gamecolor';
import { getStreamerColor } from '@/constants/streamercolor';

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 shrink-0 px-2.5 py-1 bg-red-500 dark:bg-red-600 rounded-full shadow-md shadow-red-300/50 dark:shadow-red-900/60">
      <span className="relative flex w-2 h-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80" />
        <span className="relative inline-flex rounded-full w-2 h-2 bg-white" />
      </span>
      <span className="text-[10px] font-black text-white uppercase tracking-wider">LIVE</span>
    </span>
  );
}

interface ScheduleCardProps {
  schedule: FlattenedSchedule;
  variant: 'weekly' | 'monthly' | 'mobile';
  liveStreamerIds?: Set<string>;
  index?: number;
}

export default function ScheduleCard({ schedule, variant, liveStreamerIds, index = 0 }: ScheduleCardProps) {
  const href = `/calendar/schedule/${schedule.id}`;
  const stopProp = (e: React.MouseEvent) => e.stopPropagation();
  const { resolvedTheme } = useTheme();
  const isLive =
    !schedule.isLiveEnded &&
    liveStreamerIds !== undefined &&
    isToday(new Date(schedule.startTime)) &&
    schedule.participants.some((p) => liveStreamerIds.has(p.id));
  const gameColor = schedule.game
    ? getGameColor(schedule.game.id, resolvedTheme === 'dark')
    : null;

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
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border text-sm font-bold transition-shadow ${
            isLive
              ? 'ring-1 ring-red-400/70 dark:ring-red-500/50 shadow-[0_2px_10px_rgba(239,68,68,0.18)]'
              : ''
          } ${
            gameColor
              ? ''
              : schedule.game
                ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800'
                : isLive
                  ? 'bg-red-50/60 dark:bg-red-900/10 text-slate-600 dark:text-slate-300 border-red-200 dark:border-red-700/50'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-700'
          }`}
          style={
            gameColor
              ? { backgroundColor: `${gameColor}35`, borderColor: `${gameColor}70`, color: gameColor }
              : undefined
          }
        >
          <span className="text-xs opacity-60 shrink-0 font-semibold">
            {schedule.isGuerrilla ? '미정' : format(new Date(schedule.startTime), 'HH:mm')}
          </span>
          <span className="truncate flex-1">{schedule.title}</span>
          {isLive && <LiveBadge />}
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
            className={`flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded-md border shadow-sm shrink-0 ${
              isLive
                ? 'ring-1 ring-red-400/60 dark:ring-red-500/40'
                : ''
            } ${
              gameColor
                ? ''
                : schedule.game
                  ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                  : isLive
                    ? 'bg-red-50/60 dark:bg-red-900/10 text-slate-500 dark:text-slate-300 border-red-200 dark:border-red-700/50'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-600'
            }`}
            style={
              gameColor
                ? { backgroundColor: `${gameColor}35`, borderColor: `${gameColor}70`, color: gameColor }
                : undefined
            }
          >
            <span className="opacity-70 shrink-0 font-semibold">
              {format(new Date(schedule.startTime), 'HH:mm')}
            </span>
            <span className="truncate flex-1">{schedule.title}</span>
            {isLive && <LiveBadge />}
          </div>
        </Link>
      </motion.div>
    );
  }

  // weekly
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.055, duration: 0.22, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.12, ease: 'easeOut' } }}
      whileTap={{ scale: 0.97 }}
    >
      <Link href={href} scroll={false} className="block" onClick={stopProp}>
      <div
        className={`px-2.5 py-2 rounded-xl border shadow-sm space-y-1.5 transition-shadow hover:shadow-md ${
          isLive
            ? 'ring-1 ring-red-400/70 dark:ring-red-500/50 shadow-[0_2px_12px_rgba(239,68,68,0.18)]'
            : ''
        } ${
          gameColor
            ? ''
            : schedule.game
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
              : isLive
                ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-700/50'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
        }`}
        style={
          gameColor
            ? { backgroundColor: `${gameColor}25`, borderColor: `${gameColor}70` }
            : undefined
        }
      >
        {/* 상단: 게임 배지 / 미정 배지 / 라이브 배지 */}
        <div className="flex items-center gap-1 flex-wrap">
          {schedule.game && (
            <span
              className={`inline-flex items-center gap-0.5 text-[12px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                gameColor ? '' : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400'
              }`}
              style={
                gameColor
                  ? { backgroundColor: `${gameColor}40`, color: gameColor }
                  : undefined
              }
            >
              <Gamepad2 className="w-3 h-3" />
              {schedule.game.title}
            </span>
          )}
          {schedule.isGuerrilla && (
            <span className="inline-flex items-center gap-0.5 text-[12px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 shrink-0">
              <Zap className="w-3 h-3" />
              시간 미정
            </span>
          )}
          {isLive && (
            <span className="ml-auto">
              <LiveBadge />
            </span>
          )}
        </div>

        {!schedule.isGuerrilla && (
          <div className="flex items-center gap-1 text-[13px] font-semibold text-slate-400 dark:text-slate-500">
            <Clock className="w-3 h-3 shrink-0" />
            {format(new Date(schedule.startTime), 'HH:mm')}
            {schedule.endTime && (
              <span className="opacity-70">
                → {format(new Date(schedule.endTime), 'HH:mm')}
              </span>
            )}
          </div>
        )}

        <p
          className={`text-sm font-bold line-clamp-2 leading-snug ${
            gameColor
              ? ''
              : schedule.game
                ? 'text-amber-800 dark:text-amber-300'
                : 'text-slate-700 dark:text-slate-200'
          }`}
          style={gameColor ? { color: gameColor } : undefined}
        >
          {schedule.title}
        </p>

        {schedule.participants.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {schedule.participants.slice(0, 3).map((p) => (
              <span
                key={p.id}
                className="text-[11px] font-bold px-1.5 py-0.5 rounded-full border shrink-0"
                style={((c) => ({
                  borderColor: `${c}60`,
                  color: c,
                  backgroundColor: `${c}18`,
                }))(getStreamerColor(p.id, resolvedTheme === 'dark') ?? p.colorCode)}
              >
                {p.name}
              </span>
            ))}
            {schedule.participants.length > 3 && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                +{schedule.participants.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
    </motion.div>
  );
}
