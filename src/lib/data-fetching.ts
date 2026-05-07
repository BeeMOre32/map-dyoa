/**
 * 데이터 페칭 캐싱
 * Next.js 캐싱을 활용한 DB 쿼리 최적화
 */

import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import { flattenSchedules } from './schedule-formatters';
import type { Streamer, Prisma } from '@prisma/client';

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
 * 클립 연월 목록 (필터 드롭다운용)
 */
export const getClipMonths = unstable_cache(
  async () => {
    const clips = await prisma.clip.findMany({
      select: { clipDate: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    const months = new Set<string>();
    for (const c of clips) {
      const d = new Date(c.clipDate ?? c.createdAt);
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return Array.from(months).sort().reverse();
  },
  ['clip-months'],
  { revalidate: 60, tags: ['clips'] },
);

const CLIP_INCLUDE = {
  participants: { include: { streamer: true } },
  schedule: { select: { id: true, title: true, game: { select: { id: true, title: true } } } },
} as const;

/**
 * 클립 페이지네이션 (서버사이드 필터링 포함)
 */
export type ClipSortOption = 'newest' | 'oldest' | 'date_desc' | 'date_asc' | 'title';

const CLIP_SORT_MAP: Record<ClipSortOption, Prisma.ClipOrderByWithRelationInput> = {
  newest:    { createdAt: 'desc' },
  oldest:    { createdAt: 'asc' },
  date_desc: { clipDate: 'desc' },
  date_asc:  { clipDate: 'asc' },
  title:     { title: 'asc' },
};

export async function getClipsPaginated({
  page = 1,
  pageSize = 20,
  streamerId,
  month,
  q,
  sort = 'newest',
}: {
  page?: number;
  pageSize?: number;
  streamerId?: string;
  month?: string;
  q?: string;
  sort?: ClipSortOption;
}) {
  const conditions: Prisma.ClipWhereInput[] = [];

  if (streamerId) {
    conditions.push({ participants: { some: { streamerId } } });
  }

  if (month) {
    const [year, monthNum] = month.split('-').map(Number);
    const start = new Date(year, monthNum - 1, 1);
    const end = new Date(year, monthNum, 1);
    conditions.push({
      OR: [
        { clipDate: { gte: start, lt: end } },
        { clipDate: null, createdAt: { gte: start, lt: end } },
      ],
    });
  }

  if (q) {
    conditions.push({
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { participants: { some: { streamer: { name: { contains: q, mode: 'insensitive' } } } } },
      ],
    });
  }

  const where: Prisma.ClipWhereInput = conditions.length > 0 ? { AND: conditions } : {};

  const [clips, total] = await Promise.all([
    prisma.clip.findMany({
      where,
      include: CLIP_INCLUDE,
      orderBy: CLIP_SORT_MAP[sort],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.clip.count({ where }),
  ]);

  return { clips, total, totalPages: Math.ceil(total / pageSize) };
}

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
  ['schedule-detail', scheduleId],
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
    const [schedules, linkedClips, scheduleCount, clipCount] = await Promise.all([
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
      prisma.clip.findMany({
        where: { participants: { some: { streamerId } } },
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
        take: 8,
      }),
      prisma.scheduleParticipant.count({ where: { streamerId } }),
      prisma.clip.count({ where: { participants: { some: { streamerId } } } }),
    ]);
    return { schedules, linkedClips, scheduleCount, clipCount };
  },
  ['streamer-detail'],
  { revalidate: 120, tags: ['streamers', 'calendar', 'clips'] },
);

/**
 * 관리자 대시보드 통계
 */
export const getAdminStats = unstable_cache(
  async () => {
    const [scheduleCount, clipCount, streamerCount, pendingFeedbackCount] = await Promise.all([
      prisma.schedule.count(),
      prisma.clip.count(),
      prisma.streamer.count(),
      prisma.feedback.count({ where: { status: 'PENDING' } }),
    ]);
    return { scheduleCount, clipCount, streamerCount, pendingFeedbackCount };
  },
  ['admin-stats'],
  { revalidate: 60, tags: ['admin', 'calendar', 'clips', 'streamers'] },
);

/**
 * 피드백 목록 가져오기 (캐싱 적용)
 * 필요한 컬럼만 select해 전송량 최소화
 */
/**
 * HOI4 누적 리더보드
 */
export const getHoi4Leaderboard = unstable_cache(
  async () => {
    const rows = await prisma.scheduleParticipant.findMany({
      where: { schedule: { game: { isHoi4: true }, isNaeJeon: true } },
      select: {
        scheduleId: true,
        streamerId: true,
        nation: true,
        result: true,
        streamer: { select: { id: true, name: true, colorCode: true } },
        schedule: {
          select: {
            title: true,
            startTime: true,
            game: { select: { title: true } },
          },
        },
      },
      orderBy: { schedule: { startTime: 'desc' } },
    });

    type StatEntry = {
      streamer: { id: string; name: string; colorCode: string };
      total: number;
      nations: string[];
    };
    type SessionEntry = {
      id: string; title: string; startTime: Date | string;
      game: { title: string } | null;
      participants: { streamer: { id: string; name: string; colorCode: string }; nation: string | null }[];
    };

    const statsMap = new Map<string, StatEntry>();
    const sessionMap = new Map<string, SessionEntry>();

    for (const row of rows) {
      if (!statsMap.has(row.streamerId)) {
        statsMap.set(row.streamerId, { streamer: row.streamer, total: 0, nations: [] });
      }
      const stat = statsMap.get(row.streamerId)!;
      stat.total++;
      if (row.nation && !stat.nations.includes(row.nation)) stat.nations.push(row.nation);

      if (!sessionMap.has(row.scheduleId)) {
        sessionMap.set(row.scheduleId, {
          id: row.scheduleId,
          title: row.schedule.title,
          startTime: row.schedule.startTime,
          game: row.schedule.game,
          participants: [],
        });
      }
      sessionMap.get(row.scheduleId)!.participants.push({
        streamer: row.streamer,
        nation: row.nation,
      });
    }

    const leaderboard = Array.from(statsMap.values()).sort((a, b) => b.total - a.total);

    const sessions = Array.from(sessionMap.values())
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 8)
      .map((s) => ({
        ...s,
        participants: [...s.participants].sort((a, b) =>
          a.streamer.name.localeCompare(b.streamer.name, 'ko'),
        ),
      }));

    return { leaderboard, sessions, totalSessions: sessionMap.size };
  },
  ['hoi4-leaderboard'],
  { revalidate: 120, tags: ['calendar'] },
);

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
