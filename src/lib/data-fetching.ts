/**
 * 데이터 페칭 캐싱
 * MAP_DYOA_SERVER_URL 있으면 map-dyoa-server만, 없으면 getPrismaForDomain() (로컬 전용).
 */

import { getPrismaForDomain } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import { flattenScheduleParticipants, flattenSchedules } from './schedule-formatters';
import type { Streamer, Prisma } from '@prisma/client';
import type { FlattenedSchedule, ScheduleWithRelations } from './schedule-formatters';
import {
  fetchClipMonthsFromServer,
  fetchClipsPaginatedFromServer,
  fetchScheduleClipsFromServer,
} from './map-dyoa-server-clips';
import {
  fetchAllStreamersFromServer,
  fetchStreamerByIdFromServer,
  fetchStreamerDetailFromServer,
} from './map-dyoa-server-streamers';
import {
  fetchAllGamesFromServer,
  fetchFeedbacksFromServer,
} from './map-dyoa-server-games-feedback';
import {
  fetchAdminClipsFromServer,
  fetchAdminSchedulesFromServer,
  fetchAdminStatsFromServer,
  fetchHoi4LeaderboardFromServer,
  fetchRecentActivityFromServer,
} from './map-dyoa-server-admin';
import {
  defaultScheduleFetchWindow,
  fetchScheduleByIdFromServer,
  fetchSchedulesFromServer,
  isScheduleServerEnabled,
} from './map-dyoa-server-schedules';

/**
 * 캘린더 데이터 가져오기 (캐싱 적용)
 * 60초마다 재검증
 */
export const getCalendarData = unstable_cache(
  async () => {
    const [schedules, streamers, games] = await Promise.all([
      (async () => {
        if (isScheduleServerEnabled()) {
          const { from, to } = defaultScheduleFetchWindow();
          return fetchSchedulesFromServer(from, to);
        }
        const rows = await getPrismaForDomain().schedule.findMany({
          include: {
            game: true,
            participants: {
              include: { streamer: true },
            },
          },
          orderBy: { startTime: 'asc' },
        });
        return flattenSchedules(rows as ScheduleWithRelations[]);
      })(),
      isScheduleServerEnabled()
        ? fetchAllStreamersFromServer(false)
        : getPrismaForDomain().streamer.findMany({
            orderBy: { name: 'asc' },
          }),
      isScheduleServerEnabled()
        ? fetchAllGamesFromServer()
        : getPrismaForDomain().game.findMany({
            orderBy: { title: 'asc' },
          }),
    ]);

    return {
      schedules,
      streamers,
      games,
    };
  },
  ['calendar-data', process.env.MAP_DYOA_SERVER_URL ?? 'local-prisma-schedules'],
  { revalidate: 60, tags: ['calendar'] },
);

/**
 * 모든 스트리머 가져오기 (캐싱 적용)
 */
export const getAllStreamers = unstable_cache(
  async (): Promise<Streamer[]> => {
    if (isScheduleServerEnabled()) {
      return fetchAllStreamersFromServer(false);
    }
    return getPrismaForDomain().streamer.findMany({
      orderBy: { name: 'asc' },
    });
  },
  ['streamers-all', process.env.MAP_DYOA_SERVER_URL ?? 'local-prisma-streamers-all'],
  { revalidate: 120, tags: ['streamers'] },
);

export const getMemberStreamers = unstable_cache(
  async (): Promise<Streamer[]> => {
    if (isScheduleServerEnabled()) {
      return fetchAllStreamersFromServer(true);
    }
    return getPrismaForDomain().streamer.findMany({
      where: { isGuest: false },
      orderBy: { name: 'asc' },
    });
  },
  ['streamers-members', process.env.MAP_DYOA_SERVER_URL ?? 'local-prisma-streamers-members'],
  { revalidate: 120, tags: ['streamers'] },
);

/**
 * 모든 게임 가져오기 (캐싱 적용)
 */
export const getAllGames = unstable_cache(
  async () => {
    if (isScheduleServerEnabled()) {
      return fetchAllGamesFromServer();
    }
    return getPrismaForDomain().game.findMany({
      orderBy: { title: 'asc' },
      include: { _count: { select: { schedules: true } } },
    });
  },
  ['games-all', process.env.MAP_DYOA_SERVER_URL ?? 'local-prisma-games-all'],
  { revalidate: 120, tags: ['games', 'calendar'] },
);

/**
 * 특정 날짜 범위의 일정 가져오기
 * getCalendarData() 캐시에서 필터링해 별도 DB 쿼리 없이 처리
 */
export async function getSchedulesByDateRange(startDate: Date, endDate: Date) {
  if (isScheduleServerEnabled()) {
    return fetchSchedulesFromServer(startDate, endDate);
  }
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
    if (isScheduleServerEnabled()) {
      const { clips } = await fetchClipsPaginatedFromServer({
        page: 1,
        pageSize: 500,
        sort: 'newest',
        clipsOnly: false,
      });
      return clips;
    }
    return getPrismaForDomain().clip.findMany({
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
  ['clips-all', process.env.MAP_DYOA_SERVER_URL ?? 'local-prisma-clips-all'],
  { revalidate: 60, tags: ['clips'] },
);

/**
 * 클립 연월 목록 (필터 드롭다운용)
 * `MAP_DYOA_SERVER_URL`이 있으면 map-dyoa-server가 DB에 붙고, Next는 풀러에 직접 연결하지 않음.
 */
export const getClipMonths = unstable_cache(
  async () => {
    if (isScheduleServerEnabled()) {
      return fetchClipMonthsFromServer();
    }
    const clips = await getPrismaForDomain().clip.findMany({
      select: { clipDate: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    const months = new Set<string>();
    for (const c of clips) {
      const d = new Date(c.clipDate ?? c.createdAt);
      if (!Number.isFinite(d.getTime())) continue;
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return Array.from(months).sort().reverse();
  },
  ['clip-months', process.env.MAP_DYOA_SERVER_URL ?? 'local-prisma-clip-months'],
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
  /** 서버 `clipsOnly=1`일 때 연결 방송 표시용 (캘린더 일정 목록) */
  schedulesForClipLinks,
}: {
  page?: number;
  pageSize?: number;
  streamerId?: string;
  month?: string;
  q?: string;
  sort?: ClipSortOption;
  schedulesForClipLinks?: FlattenedSchedule[];
}) {
  if (isScheduleServerEnabled()) {
    return fetchClipsPaginatedFromServer({
      page,
      pageSize,
      streamerId,
      month,
      q,
      sort,
      clipsOnly: true,
      schedulesForClipLinks,
    });
  }

  const conditions: Prisma.ClipWhereInput[] = [];

  if (streamerId) {
    conditions.push({ participants: { some: { streamerId } } });
  }

  const monthKey = month?.trim();
  if (monthKey && /^\d{4}-\d{2}$/.test(monthKey)) {
    const year = Number(monthKey.slice(0, 4));
    const monthNum = Number(monthKey.slice(5, 7));
    if (Number.isFinite(year) && Number.isFinite(monthNum) && monthNum >= 1 && monthNum <= 12) {
      const start = new Date(year, monthNum - 1, 1);
      const end = new Date(year, monthNum, 1);
      conditions.push({
        OR: [
          { clipDate: { gte: start, lt: end } },
          { clipDate: null, createdAt: { gte: start, lt: end } },
        ],
      });
    }
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
    getPrismaForDomain().clip.findMany({
      where,
      include: CLIP_INCLUDE,
      orderBy: CLIP_SORT_MAP[sort],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    getPrismaForDomain().clip.count({ where }),
  ]);

  return { clips, total, totalPages: Math.ceil(total / pageSize) };
}

/**
 * 특정 스케줄 상세 (캐싱). `MAP_DYOA_SERVER_URL`이 있으면 외부 API, 없으면 Prisma.
 * 반환은 항상 `FlattenedSchedule` | null.
 */
export function getScheduleDetail(scheduleId: string) {
  return unstable_cache(
    async () => {
      if (isScheduleServerEnabled()) {
        return fetchScheduleByIdFromServer(scheduleId);
      }
      const row = await getPrismaForDomain().schedule.findUnique({
        where: { id: scheduleId },
        include: {
          game: true,
          participants: { include: { streamer: true } },
        },
      });
      if (!row) return null;
      return flattenScheduleParticipants(row as ScheduleWithRelations);
    },
    [
      'schedule-detail',
      scheduleId,
      process.env.MAP_DYOA_SERVER_URL ?? 'local-prisma-schedule-detail',
    ],
    { revalidate: 60, tags: ['calendar'] },
  )();
}

/**
 * 일정에 연결된 클립 목록. `MAP_DYOA_SERVER_URL`이 있으면 외부 API, 없으면 Prisma.
 */
export function getScheduleClips(scheduleId: string) {
  return unstable_cache(
    async () => {
      if (isScheduleServerEnabled()) {
        return fetchScheduleClipsFromServer(scheduleId);
      }
      return getPrismaForDomain().clip.findMany({
        where: { scheduleId },
        include: { participants: { include: { streamer: true } } },
        orderBy: { createdAt: 'asc' },
      });
    },
    [
      'schedule-clips',
      scheduleId,
      process.env.MAP_DYOA_SERVER_URL ?? 'local-prisma-schedule-clips',
    ],
    { revalidate: 60, tags: ['clips'] },
  )();
}

export function getStreamerById(streamerId: string) {
  return unstable_cache(
    async () => {
      if (isScheduleServerEnabled()) {
        return fetchStreamerByIdFromServer(streamerId);
      }
      return getPrismaForDomain().streamer.findUnique({ where: { id: streamerId } });
    },
    [
      'streamer-by-id',
      streamerId,
      process.env.MAP_DYOA_SERVER_URL ?? 'local-prisma-streamer-by-id',
    ],
    { revalidate: 120, tags: ['streamers'] },
  )();
}

export function getStreamerDetail(streamerId: string) {
  return unstable_cache(
    async () => {
      if (isScheduleServerEnabled()) {
        return fetchStreamerDetailFromServer(streamerId);
      }
      const [schedules, linkedClips, scheduleCount, clipCount] = await Promise.all([
        getPrismaForDomain().schedule.findMany({
          where: { participants: { some: { streamerId, isGuest: false } } },
          include: {
            game: { select: { id: true, title: true, isHoi4: true } },
            participants: {
              select: {
                nation: true,
                result: true,
                isGuest: true,
                streamer: { select: { id: true, name: true, colorCode: true } },
              },
            },
          },
          orderBy: { startTime: 'desc' },
          take: 20,
        }),
        getPrismaForDomain().clip.findMany({
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
        getPrismaForDomain().scheduleParticipant.count({ where: { streamerId, isGuest: false } }),
        getPrismaForDomain().clip.count({ where: { participants: { some: { streamerId } } } }),
      ]);
      return { schedules, linkedClips, scheduleCount, clipCount };
    },
    [
      'streamer-detail',
      streamerId,
      process.env.MAP_DYOA_SERVER_URL ?? 'local-prisma-streamer-detail',
    ],
    { revalidate: 120, tags: ['streamers', 'calendar', 'clips'] },
  )();
}

/**
 * 관리자 대시보드 통계
 */
export const getAdminStats = unstable_cache(
  async () => {
    if (isScheduleServerEnabled()) {
      return fetchAdminStatsFromServer();
    }
    const [scheduleCount, clipCount, streamerCount, pendingFeedbackCount] = await Promise.all([
      getPrismaForDomain().schedule.count(),
      getPrismaForDomain().clip.count(),
      getPrismaForDomain().streamer.count({ where: { isGuest: false } }),
      getPrismaForDomain().feedback.count({ where: { status: 'PENDING' } }),
    ]);
    return { scheduleCount, clipCount, streamerCount, pendingFeedbackCount };
  },
  ['admin-stats', process.env.MAP_DYOA_SERVER_URL ?? 'local-prisma-admin-stats'],
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
    if (isScheduleServerEnabled()) {
      return fetchHoi4LeaderboardFromServer();
    }
    const rows = await getPrismaForDomain().scheduleParticipant.findMany({
      where: { isGuest: false, schedule: { game: { isHoi4: true }, isNaeJeon: true } },
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
  ['hoi4-leaderboard', process.env.MAP_DYOA_SERVER_URL ?? 'local-prisma-hoi4'],
  { revalidate: 120, tags: ['calendar'] },
);

/** 일정 AI 추출·이미지 분석용 스트리머·게임 목록 */
export async function fetchExtractContextLists(): Promise<{
  streamers: { id: string; name: string }[];
  games: { id: string; title: string }[];
}> {
  if (isScheduleServerEnabled()) {
    const [streamers, games] = await Promise.all([
      fetchAllStreamersFromServer(false),
      fetchAllGamesFromServer(),
    ]);
    return {
      streamers: streamers.map((s) => ({ id: s.id, name: s.name })),
      games: games.map((g) => ({ id: g.id, title: g.title })),
    };
  }
  const [streamers, games] = await Promise.all([
    getPrismaForDomain().streamer.findMany({ select: { id: true, name: true } }),
    getPrismaForDomain().game.findMany({ select: { id: true, title: true } }),
  ]);
  return { streamers, games };
}

export const getFeedbacks = unstable_cache(
  async () => {
    if (isScheduleServerEnabled()) {
      return fetchFeedbacksFromServer();
    }
    return getPrismaForDomain().feedback.findMany({
      select: {
        id: true,
        type: true,
        status: true,
        category: true,
        streamerName: true,
        content: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },
  ['feedbacks-all', process.env.MAP_DYOA_SERVER_URL ?? 'local-prisma-feedbacks-all'],
  { revalidate: 30, tags: ['admin'] },
);

export const getAdminClips = unstable_cache(
  async () => {
    if (isScheduleServerEnabled()) {
      return fetchAdminClipsFromServer();
    }
    return getPrismaForDomain().clip.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        participants: { include: { streamer: { select: { id: true, name: true, colorCode: true } } } },
      },
    });
  },
  ['admin-clips-all', process.env.MAP_DYOA_SERVER_URL ?? 'local-prisma-admin-clips'],
  { revalidate: 30, tags: ['clips', 'admin'] },
);

export async function getAdminSchedules(from?: string, to?: string) {
  if (isScheduleServerEnabled()) {
    return fetchAdminSchedulesFromServer(from, to);
  }
  const where: Prisma.ScheduleWhereInput = {};
  if (from || to) {
    where.startTime = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to + 'T23:59:59') } : {}),
    };
  }
  return getPrismaForDomain().schedule.findMany({
    where,
    orderBy: { startTime: 'desc' },
    include: {
      game: { select: { id: true, title: true } },
      participants: { include: { streamer: { select: { id: true, name: true, colorCode: true } } } },
    },
    take: 200,
  });
}

export const getRecentActivity = unstable_cache(
  async () => {
    if (isScheduleServerEnabled()) {
      return fetchRecentActivityFromServer();
    }
    const [schedules, clips] = await Promise.all([
      getPrismaForDomain().schedule.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          startTime: true,
          createdAt: true,
          game: { select: { title: true } },
        },
      }),
      getPrismaForDomain().clip.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          createdAt: true,
          participants: { include: { streamer: { select: { name: true } } } },
        },
      }),
    ]);
    return { schedules, clips };
  },
  ['recent-activity', process.env.MAP_DYOA_SERVER_URL ?? 'local-prisma-recent-activity'],
  { revalidate: 60, tags: ['calendar', 'clips'] },
);
