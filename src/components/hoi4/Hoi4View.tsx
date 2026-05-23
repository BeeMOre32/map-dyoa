'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { format, isValid } from 'date-fns';
import { ko } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  ChevronDown,
  Clock,
  FilterX,
  Globe2,
  Medal,
  Sword,
  Users,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import StatsCountUp from '@/components/Calendar/StatsCountUp';
import FavoritesOnlyToggle from '@/components/Common/FavoritesOnlyToggle';
import StreamerAvatar from '@/components/streamer/StreamerAvatar';
import { getStreamerColor } from '@/constants/streamercolor';
import { useFavoriteStreamers } from '@/hooks/useFavoriteStreamers';
import type { Hoi4LeaderboardData } from '@/lib/data-fetching';
import { markModalSoftNav } from '@/lib/modal-navigation';
import { getStreamerImagePath } from '@/lib/utils';
import {
  statsInteractiveHover,
  statsListVariants,
  statsPageHeaderVariants,
  statsRowVariants,
  statsSectionVariants,
  statsTileGridVariants,
  statsTileVariants,
} from '@/lib/statsMotion';

const SESSIONS_PAGE = 8;

function formatSessionDate(d: Date | string) {
  const dt = new Date(d);
  if (!isValid(dt)) return '—';
  return format(dt, 'yyyy. MM. dd', { locale: ko });
}

function resultBadgeClass(result: string | null | undefined): string {
  if (!result?.trim()) return '';
  const r = result.trim();
  if (/승|win|victory/i.test(r)) {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300';
  }
  if (/패|loss|defeat/i.test(r)) {
    return 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300';
  }
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
}

function rankLabel(index: number): string | null {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return null;
}

interface Hoi4ViewProps {
  data: Hoi4LeaderboardData;
}

export default function Hoi4View({ data }: Hoi4ViewProps) {
  const { leaderboard, sessions, totalSessions } = data;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { favoriteIds, favoritesOnly, setFavoritesOnly } = useFavoriteStreamers();
  const [visibleSessions, setVisibleSessions] = useState(SESSIONS_PAGE);

  useEffect(() => {
    setVisibleSessions(SESSIONS_PAGE);
  }, [favoritesOnly]);

  const uniqueNations = useMemo(() => {
    const set = new Set<string>();
    for (const entry of leaderboard) {
      for (const nation of entry.nations) set.add(nation);
    }
    return set.size;
  }, [leaderboard]);

  const filteredLeaderboard = useMemo(() => {
    if (!favoritesOnly || favoriteIds.size === 0) return leaderboard;
    return leaderboard.filter((entry) => favoriteIds.has(entry.streamer.id));
  }, [leaderboard, favoritesOnly, favoriteIds]);

  const filteredSessions = useMemo(() => {
    if (!favoritesOnly || favoriteIds.size === 0) return sessions;
    return sessions.filter((session) =>
      session.participants.some((p) => favoriteIds.has(p.streamer.id)),
    );
  }, [sessions, favoritesOnly, favoriteIds]);

  const maxParticipations = filteredLeaderboard[0]?.total ?? 1;

  const memberGridClass =
    filteredLeaderboard.length <= 4
      ? 'grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3'
      : 'grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 sm:gap-3';

  const hasActiveFilter = favoritesOnly && favoriteIds.size > 0;
  const showFilterEmpty =
    hasActiveFilter &&
    filteredLeaderboard.length === 0 &&
    filteredSessions.length === 0 &&
    (leaderboard.length > 0 || sessions.length > 0);

  const visibleSessionList = filteredSessions.slice(0, visibleSessions);
  const canLoadMore = visibleSessions < filteredSessions.length;

  const clearFilter = () => setFavoritesOnly(false);

  if (leaderboard.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white dark:bg-slate-950">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          className="space-y-3 p-8 text-center"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 dark:bg-amber-900/20">
            <Sword className="h-8 w-8 text-amber-300 dark:text-amber-700" />
          </div>
          <p className="font-black text-slate-500 dark:text-slate-400">
            아직 HOI4 전적이 없습니다
          </p>
          <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
            내전 일정에서 멤버별 국가를 입력하면 여기에 모입니다
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white transition-colors dark:bg-slate-950">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={statsPageHeaderVariants}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-linear-to-br from-amber-500/10 via-orange-500/5 to-transparent dark:from-amber-500/15 dark:via-orange-900/10" />
        <div className="relative px-4 pb-5 pt-6 text-center sm:pb-7 sm:pt-10">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 shadow-lg shadow-amber-500/10 dark:bg-amber-900/40 sm:mb-4 sm:h-16 sm:w-16 sm:rounded-3xl">
            <Sword className="h-6 w-6 text-amber-500 dark:text-amber-400 sm:h-8 sm:w-8" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl md:text-3xl">
            HOI4 참전 기록
          </h1>
          <p className="mt-1 text-xs font-bold text-slate-400 dark:text-slate-500 sm:text-sm">
            지도동 내전 · 참전 세션 누적
          </p>

          <motion.div
            variants={statsTileGridVariants}
            initial="hidden"
            animate="visible"
            className="mx-auto mt-4 grid max-w-md grid-cols-3 gap-2 sm:mt-5 sm:gap-3"
          >
            {[
              {
                icon: Users,
                label: '참전 멤버',
                value: hasActiveFilter ? filteredLeaderboard.length : leaderboard.length,
              },
              {
                icon: Clock,
                label: '총 세션',
                value: hasActiveFilter ? filteredSessions.length : totalSessions,
              },
              {
                icon: Globe2,
                label: '플레이 국가',
                value: uniqueNations,
              },
            ].map(({ icon: Icon, label, value }, i) => (
              <motion.div
                key={label}
                custom={i}
                variants={statsTileVariants}
                className="rounded-2xl border border-amber-100/80 bg-white/80 px-2 py-2.5 shadow-sm dark:border-amber-900/40 dark:bg-slate-900/70 sm:px-3 sm:py-3"
              >
                <Icon className="mx-auto mb-1 h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                <StatsCountUp
                  value={value}
                  delay={0.08 + i * 0.05}
                  className="block text-lg font-black tabular-nums text-slate-900 dark:text-white sm:text-xl"
                />
                <p className="mt-0.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 sm:text-[11px]">
                  {label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      <div className="mx-auto max-w-4xl space-y-8 px-4 pb-16 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <FavoritesOnlyToggle />
          {hasActiveFilter && (
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
              관심 멤버 기준으로 표시 중
            </span>
          )}
        </div>

        {showFilterEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-2.5">
              <FilterX className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                관심 멤버의 HOI4 참전 기록이 없어요
              </p>
            </div>
            <motion.button
              type="button"
              onClick={clearFilter}
              {...statsInteractiveHover}
              className="shrink-0 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-black text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
            >
              필터 초기화
            </motion.button>
          </motion.div>
        )}

        {filteredLeaderboard.length > 0 && (
          <motion.section
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={statsSectionVariants}
            className="space-y-3"
          >
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <Medal className="h-4 w-4 text-amber-500" />
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                  멤버 · 플레이 국가
                </p>
              </div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                탭하면 멤버 상세
              </span>
            </div>

            <motion.div
              variants={statsListVariants}
              initial="hidden"
              animate="visible"
              className={memberGridClass}
            >
              {filteredLeaderboard.map((entry, index) => {
                const color =
                  getStreamerColor(entry.streamer.id, isDark) ??
                  entry.streamer.colorCode;
                const medal = rankLabel(index);
                return (
                  <motion.div
                    key={entry.streamer.id}
                    custom={index}
                    variants={statsRowVariants}
                    className="min-w-0"
                  >
                    <Link
                      href={`/streamers/detail/${entry.streamer.id}`}
                      scroll={false}
                      onClick={markModalSoftNav}
                      className="group relative flex h-full flex-col items-center gap-2 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center transition-[border-color,box-shadow,transform] hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700/60"
                    >
                      {medal ? (
                        <span className="absolute right-2 top-2 text-sm leading-none">
                          {medal}
                        </span>
                      ) : (
                        <span className="absolute right-2 top-2 text-[10px] font-black tabular-nums text-slate-300 dark:text-slate-600">
                          {index + 1}
                        </span>
                      )}

                      <StreamerAvatar
                        name={entry.streamer.name}
                        imgSrc={getStreamerImagePath(entry.streamer.name)}
                        colorCode={entry.streamer.colorCode}
                        streamerId={entry.streamer.id}
                        size="small"
                      />

                      <div className="min-w-0 w-full space-y-1">
                        <p
                          className="truncate text-sm font-black leading-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                          style={{ color }}
                        >
                          {entry.streamer.name}
                        </p>
                        <p className="text-[10px] font-black tabular-nums text-slate-400 dark:text-slate-500">
                          {entry.total}회 참전
                        </p>
                      </div>

                      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{
                            width: `${Math.max(8, (entry.total / maxParticipations) * 100)}%`,
                          }}
                          viewport={{ once: true }}
                          transition={{
                            type: 'spring',
                            stiffness: 120,
                            damping: 24,
                            delay: 0.08,
                          }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      </div>

                      {entry.nations.length > 0 ? (
                        <div className="flex min-h-[2.25rem] w-full flex-wrap justify-center gap-1">
                          {entry.nations.slice(0, 3).map((n) => (
                            <span
                              key={n}
                              className="max-w-full truncate rounded-md border border-amber-100 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400"
                            >
                              {n}
                            </span>
                          ))}
                          {entry.nations.length > 3 && (
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">
                              +{entry.nations.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="min-h-[2.25rem] text-[10px] font-medium text-slate-300 dark:text-slate-600">
                          국가 미등록
                        </span>
                      )}

                      <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-indigo-500 opacity-0 transition-opacity group-hover:opacity-100 dark:text-indigo-400">
                        멤버 상세
                        <ArrowUpRight className="h-3 w-3" />
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.section>
        )}

        {filteredSessions.length > 0 && (
          <motion.section
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={statsSectionVariants}
            className="space-y-3"
          >
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <Sword className="h-4 w-4 text-amber-500" />
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                  최근 세션
                </p>
              </div>
              <span className="text-[10px] font-bold tabular-nums text-slate-400 dark:text-slate-500">
                {filteredSessions.length}개
              </span>
            </div>

            <motion.div
              variants={statsListVariants}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              <AnimatePresence initial={false}>
                {visibleSessionList.map((session, index) => (
                  <motion.div
                    key={session.id}
                    custom={index}
                    variants={statsRowVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, y: -8 }}
                    layout
                    className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <Link
                      href={`/calendar/schedule/${session.id}`}
                      scroll={false}
                      onClick={markModalSoftNav}
                      className="group flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 transition-colors hover:bg-white dark:border-slate-800 dark:hover:bg-slate-800/60"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <Sword className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                        <span className="truncate text-sm font-black text-slate-800 dark:text-white">
                          {session.title}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                          {formatSessionDate(session.startTime)}
                        </span>
                        <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-indigo-500 dark:text-slate-600 dark:group-hover:text-indigo-400" />
                      </div>
                    </Link>

                    <div className="flex flex-wrap gap-2 px-4 py-3">
                      {session.participants.map((p) => {
                        const c =
                          getStreamerColor(p.streamer.id, isDark) ??
                          p.streamer.colorCode;
                        const resultClass = resultBadgeClass(p.result);
                        return (
                          <Link
                            key={p.streamer.id}
                            href={`/streamers/detail/${p.streamer.id}`}
                            scroll={false}
                            onClick={markModalSoftNav}
                            className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-white py-1.5 pl-2.5 pr-3 transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-700/50 dark:hover:bg-indigo-950/20"
                          >
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: c }}
                            />
                            <span
                              className="text-xs font-black leading-none"
                              style={{ color: c }}
                            >
                              {p.streamer.name}
                            </span>
                            {p.nation ? (
                              <span className="text-[11px] font-semibold leading-none text-slate-500 dark:text-slate-400">
                                {p.nation}
                              </span>
                            ) : null}
                            {p.result?.trim() ? (
                              <span
                                className={`rounded-md px-1.5 py-0.5 text-[10px] font-black leading-none ${resultClass}`}
                              >
                                {p.result.trim()}
                              </span>
                            ) : null}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {canLoadMore && (
              <motion.button
                type="button"
                onClick={() => setVisibleSessions((n) => n + SESSIONS_PAGE)}
                {...statsInteractiveHover}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-black text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                더 보기
                <ChevronDown className="h-4 w-4" />
              </motion.button>
            )}
          </motion.section>
        )}
      </div>
    </div>
  );
}
