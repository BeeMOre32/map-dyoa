'use client';

import type { CSSProperties } from 'react';
import { format, isToday, isValid } from 'date-fns';
import Link from 'next/link';
import { Clock, Gamepad2, CircleAlert } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { scheduleCardVariants } from '@/lib/calendarMotion';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';
import { getGameColor } from '@/constants/gamecolor';
import { getStreamerColor } from '@/constants/streamercolor';

function formatScheduleHHmm(schedule: FlattenedSchedule): string {
  if (schedule.isGuerrilla) return '미정';
  const d = new Date(schedule.startTime);
  return isValid(d) ? format(d, 'HH:mm') : '–';
}

function formatEndHHmmIfValid(end: Date | string | null | undefined): string | null {
  if (end == null) return null;
  const d = new Date(end);
  return isValid(d) ? format(d, 'HH:mm') : null;
}

/** 게임/스트리머 틴트 배경 위 본문·칩용 고대비 텍스트 */
const readableOnTint = {
  light: '#0f172a',
  dark: '#f1f5f9',
} as const;

function gameCardSurfaceStyle(
  gameColor: string,
  isDark: boolean,
  compact = false,
): CSSProperties {
  const base = isDark ? 'rgb(30 41 59)' : '#ffffff';
  return {
    backgroundColor: base,
    backgroundImage: `linear-gradient(128deg, ${gameColor}${isDark ? (compact ? '32' : '42') : compact ? '24' : '30'} 0%, ${base} ${compact ? '50%' : '58%'})`,
    borderColor: `${gameColor}${isDark ? '70' : '55'}`,
    boxShadow: compact
      ? undefined
      : isDark
        ? '0 2px 8px rgba(0,0,0,0.28)'
        : '0 2px 8px rgba(15,23,42,0.1)',
  };
}

function LiveBadge({ compact }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-red-500 shadow-sm shadow-red-500/30 ${
        compact ? 'px-1.5 py-0.5' : 'px-2 py-0.5'
      }`}
    >
      <span className={`rounded-full bg-white animate-ping ${compact ? 'h-1 w-1' : 'h-1.5 w-1.5'}`} />
      <span className={`font-black tracking-wide text-white ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
        LIVE
      </span>
    </span>
  );
}

function EndedBadge({ compact }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-slate-500 dark:bg-slate-600 ${
        compact ? 'px-1.5 py-0.5' : 'px-2 py-0.5'
      }`}
    >
      <span className={`rounded-full bg-white/90 ${compact ? 'h-1 w-1' : 'h-1.5 w-1.5'}`} />
      <span className={`font-black tracking-wide text-white ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
        종료
      </span>
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
  const startD = new Date(schedule.startTime);
  const isToday_ = isValid(startD) && isToday(startD);
  const isLive =
    !schedule.isLiveEnded &&
    liveStreamerIds !== undefined &&
    isToday_ &&
    schedule.participants.some((p) => liveStreamerIds.has(p.id));
  const isEnded = schedule.isLiveEnded && isToday_;
  const gameColor = schedule.game ? getGameColor(schedule.game.id, isDark) : null;
  const hasGameTitle = Boolean(schedule.game?.title?.trim());
  const endTimeHm = formatEndHHmmIfValid(schedule.endTime);
  const accentColor = gameColor ?? (isDark ? '#6366f1' : '#818cf8');
  const hasGame = Boolean(schedule.game);

  if (variant === 'mobile') {
    return (
      <motion.div
        custom={index}
        initial="hidden"
        animate="visible"
        variants={scheduleCardVariants.mobile}
        whileTap={{ scale: 0.98, transition: { type: 'spring', stiffness: 500, damping: 30 } }}
        className="min-w-0"
      >
        <Link
          href={href}
          scroll={false}
          onClick={stopProp}
          className={`flex items-center gap-2.5 rounded-xl border py-3 pl-3.5 pr-3.5 shadow-md transition-[box-shadow,border-color] hover:shadow-lg ${
            isLive ? 'ring-1 ring-red-400/50' : ''
          } ${
            gameColor
              ? 'bg-white dark:bg-slate-800'
              : hasGame
                ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40'
                : 'border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800'
          }`}
          style={{
            borderLeftWidth: 4,
            borderLeftColor: accentColor,
            ...(gameColor ? gameCardSurfaceStyle(gameColor, isDark) : {}),
          }}
        >
          <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200">
            {formatScheduleHHmm(schedule)}
          </span>
          <span className="min-w-0 flex-1 truncate text-[15px] font-semibold leading-snug text-slate-900 dark:text-white">
            {schedule.title}
          </span>
          {isLive && <LiveBadge compact />}
          {isEnded && <EndedBadge compact />}
        </Link>
      </motion.div>
    );
  }

  if (variant === 'monthly') {
    return (
      <motion.div
        custom={index}
        initial="hidden"
        animate="visible"
        variants={scheduleCardVariants.monthly}
        className="min-w-0"
      >
        <Link href={href} scroll={false} className="block min-w-0" onClick={stopProp}>
          <div
            className={`flex w-full min-w-0 items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] leading-tight ${
              isLive
                ? 'ring-1 ring-red-400/50 dark:ring-red-500/40'
                : ''
            } ${
              gameColor
                ? 'bg-white dark:bg-slate-800'
                : hasGame
                  ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/50'
                  : 'border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800'
            }`}
            style={{
              borderLeftWidth: 3,
              borderLeftColor: gameColor ?? accentColor,
              ...(gameColor ? gameCardSurfaceStyle(gameColor, isDark, true) : {}),
            }}
          >
            <span className="shrink-0 font-semibold tabular-nums text-slate-600 dark:text-slate-300">
              {schedule.isGuerrilla ? '미정' : formatScheduleHHmm(schedule)}
            </span>
            <span className="min-w-0 flex-1 truncate font-semibold text-slate-900 dark:text-white">
              {schedule.title}
            </span>
            {isLive && <LiveBadge compact />}
            {isEnded && <EndedBadge compact />}
          </div>
        </Link>
      </motion.div>
    );
  }

  // weekly
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={scheduleCardVariants.weekly}
      whileHover={{ y: -2, transition: { type: 'spring', stiffness: 420, damping: 28 } }}
      whileTap={{ scale: 0.99, transition: { type: 'spring', stiffness: 500, damping: 32 } }}
      className="min-w-0"
    >
      <Link href={href} scroll={false} className="block min-w-0" onClick={stopProp}>
        <div
          className={`relative flex w-full min-h-20 flex-col gap-2.5 overflow-hidden rounded-xl border px-3.5 py-3 shadow-md transition-[box-shadow,border-color] hover:shadow-lg ${
            isLive
              ? 'ring-1 ring-red-400/55 shadow-[0_2px_14px_rgba(239,68,68,0.18)] dark:ring-red-500/45'
              : ''
          } ${
            gameColor
              ? 'bg-white dark:bg-slate-800'
              : hasGame
                ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40'
                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-slate-500'
          }`}
          style={{
            borderLeftWidth: 4,
            borderLeftColor: gameColor ?? accentColor,
            ...(gameColor ? gameCardSurfaceStyle(gameColor, isDark) : {}),
          }}
        >
          <div className="flex items-center justify-between gap-2 min-h-[22px]">
            {schedule.isGuerrilla ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 dark:text-amber-200">
                <CircleAlert className="h-4 w-4 shrink-0" />
                시간 미정
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                <Clock
                  className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400"
                  style={gameColor ? { color: gameColor } : undefined}
                />
                {formatScheduleHHmm(schedule)}
                {endTimeHm ? (
                  <span className="text-slate-600 dark:text-slate-300">→ {endTimeHm}</span>
                ) : null}
              </span>
            )}
            {(isLive || isEnded) && (
              <span className="shrink-0">{isLive ? <LiveBadge /> : <EndedBadge />}</span>
            )}
          </div>

          <p
            className={`line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight ${
              hasGame && !gameColor
                ? 'text-amber-950 dark:text-amber-50'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {schedule.title}
          </p>

          {(hasGameTitle || schedule.participants.length > 0) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {hasGameTitle && schedule.game && (
                <span
                  className="inline-flex max-w-full items-center gap-1 truncate rounded-md px-2 py-0.5 text-[11px] font-medium"
                  style={
                    gameColor
                      ? {
                          backgroundColor: isDark ? `${gameColor}48` : `${gameColor}38`,
                          color: isDark ? readableOnTint.dark : readableOnTint.light,
                          border: `1px solid ${gameColor}65`,
                        }
                      : {
                          backgroundColor: isDark
                            ? 'rgba(245,158,11,0.28)'
                            : 'rgba(245,158,11,0.2)',
                          color: isDark ? '#fef3c7' : '#78350f',
                          border: '1px solid rgba(245,158,11,0.4)',
                        }
                  }
                >
                  <Gamepad2
                    className="h-3.5 w-3.5 shrink-0"
                    style={gameColor ? { color: gameColor } : undefined}
                  />
                  <span className="truncate">{schedule.game.title}</span>
                </span>
              )}
              {schedule.participants.slice(0, 3).map((p) => {
                const c = getStreamerColor(p.id, isDark) ?? p.colorCode;
                return (
                  <span
                    key={p.id}
                    className="truncate rounded-md border px-2 py-0.5 text-[11px] font-medium"
                    style={{
                      borderColor: `${c}70`,
                      color: isDark ? readableOnTint.dark : readableOnTint.light,
                      backgroundColor: isDark ? `${c}45` : `${c}28`,
                    }}
                  >
                    {p.name}
                  </span>
                );
              })}
              {schedule.participants.length > 3 && (
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
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
