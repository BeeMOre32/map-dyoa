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
 * 클립 목록 가져오기 (캐싱 적용)
 */
export const getAllClips = unstable_cache(
  async () => {
    return prisma.clip.findMany({
      include: {
        participants: { include: { streamer: true } },
        schedule: {
          select: {
            id: true,
            title: true,
            game: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
  ['clips-all'],
  { revalidate: 60, tags: ['clips'] },
);

/**
 * 특정 스케줄 상세 가져오기 (캐싱 적용)
 * 스케줄 ID별로 별도 캐시 엔트리 생성
 */
export const getScheduleDetail = unstable_cache(
  async (scheduleId: string) => {
    return prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        game: true,
        participants: { include: { streamer: true } },
      },
    });
  },
  ['schedule-detail'],
  { revalidate: 60, tags: ['calendar'] },
);

/**
 * 특정 스케줄의 클립 목록 가져오기 (캐싱 적용)
 */
export const getScheduleClips = unstable_cache(
  async (scheduleId: string) => {
    return prisma.clip.findMany({
      where: { scheduleId },
      include: { participants: { include: { streamer: true } } },
      orderBy: { createdAt: 'asc' },
    });
  },
  ['schedule-clips'],
  { revalidate: 60, tags: ['clips'] },
);

/**
 * 스트리머 상세 데이터 가져오기 (캐싱 적용)
 * 스트리머 ID별로 별도 캐시 엔트리 생성
 */
export const getStreamerById = unstable_cache(
  async (streamerId: string) => {
    return prisma.streamer.findUnique({ where: { id: streamerId } });
  },
  ['streamer-by-id'],
  { revalidate: 120, tags: ['streamers'] },
);

export const getStreamerDetail = unstable_cache(
  async (streamerId: string) => {
    const [schedules, scheduleCount, clipCount] = await Promise.all([
      prisma.schedule.findMany({
        where: { participants: { some: { streamerId } } },
        include: {
          game: { select: { id: true, title: true, isHoi4: true } },
          participants: {
            select: {
              nation: true,
              result: true,
              streamer: { select: { id: true, name: true, colorCode: true } },
            },
          },
        },
        orderBy: { startTime: 'desc' },
        take: 20,
      }),
      prisma.scheduleParticipant.count({ where: { streamerId } }),
      prisma.clip.count({ where: { participants: { some: { streamerId } } } }),
    ]);
    return { schedules, scheduleCount, clipCount };
  },
  ['streamer-detail'],
  { revalidate: 120, tags: ['streamers', 'calendar', 'clips'] },
);

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
