/**
 * 데이터 페칭 캐싱
 * Next.js 캐싱을 활용한 DB 쿼리 최적화
 */

import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import { flattenSchedules } from './schedule-formatters';
import type { Streamer } from '@prisma/client';

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
  async (): Promise<Streamer[]> => {
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
 * 특정 날짜 범위의 일정 가져오기
 * getCalendarData() 캐시에서 필터링해 별도 DB 쿼리 없이 처리
 */
export async function getSchedulesByDateRange(startDate: Date, endDate: Date) {
  const { schedules } = await getCalendarData();
  const start = startDate.getTime();
  const end = endDate.getTime();
  return schedules.filter((s) => {
    const t = new Date(s.startTime).getTime();
    return t >= start && t <= end;
  });
}

/**
 * 피드백 목록 가져오기 (캐싱 적용)
 * 필요한 컬럼만 select해 전송량 최소화
 */
export const getFeedbacks = unstable_cache(
  async () => {
    return prisma.feedback.findMany({
      select: {
        id: true,
        status: true,
        category: true,
        streamerName: true,
        content: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },
  ['feedbacks-all'],
  { revalidate: 30, tags: ['admin'] },
);
