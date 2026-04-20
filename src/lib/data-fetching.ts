/**
 * 데이터 페칭 캐싱
 * Next.js 캐싱을 활용한 DB 쿼리 최적화
 */

import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import { flattenSchedules } from './schedule-formatters';

/**
 * 캘린더 데이터 가져오기 (캐싱 적용)
 * 60초마다 재검증
 */
export const getCalendarData = unstable_cache(
  async () => {
    const [schedules, streamers, games] = await Promise.all([
      prisma.schedule.findMany({
        include: {
          game: true,
          participants: {
            include: { streamer: true },
          },
        },
        orderBy: { startTime: 'asc' },
      }),
      prisma.streamer.findMany({
        orderBy: { name: 'asc' },
      }),
      prisma.game.findMany({
        orderBy: { title: 'asc' },
      }),
    ]);

    return {
      schedules: flattenSchedules(schedules),
      streamers,
      games,
    };
  },
  ['calendar-data'],
  { revalidate: 60, tags: ['calendar'] },
);

/**
 * 모든 스트리머 가져오기 (캐싱 적용)
 */
export const getAllStreamers = unstable_cache(
  async () => {
    return prisma.streamer.findMany({
      orderBy: { name: 'asc' },
    });
  },
  ['streamers-all'],
  { revalidate: 120, tags: ['streamers'] },
);

/**
 * 모든 게임 가져오기 (캐싱 적용)
 */
export const getAllGames = unstable_cache(
  async () => {
    return prisma.game.findMany({
      orderBy: { title: 'asc' },
    });
  },
  ['games-all'],
  { revalidate: 120, tags: ['games'] },
);

/**
 * 특정 날짜의 일정 가져오기
 */
export const getSchedulesByDateRange = unstable_cache(
  async (startDate: Date, endDate: Date) => {
    const schedules = await prisma.schedule.findMany({
      where: {
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        game: true,
        participants: {
          include: { streamer: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return flattenSchedules(schedules);
  },
  ['schedules-by-date'],
  { revalidate: 30, tags: ['schedule'] },
);
