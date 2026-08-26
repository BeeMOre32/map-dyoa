import { getPrisma, getPrismaForDomain } from '@/lib/prisma';
import { extractChzzkChannelId } from '@/lib/chzzk';
import {
  fetchChzzkLiveDetail,
  mapWithConcurrency,
  parseChzzkOpenDate,
} from '@/lib/chzzk-api';
import { getLiveStreamerIds } from '@/lib/chzzk-live-status';
import { toKstDateKey, kstDayBounds } from '@/lib/backend-health';
import { appDataRetentionCutoff } from '@/lib/app-data-retention';
import {
  fetchSchedulesFromServer,
  getScheduleServerBaseUrl,
  isScheduleServerEnabled,
} from '@/lib/map-dyoa-server-schedules';
import { fetchAllStreamersFromServer } from '@/lib/map-dyoa-server-streamers';
import { fetchWithBackoff } from '@/lib/map-dyoa-server-http-utils';
import { revalidateScheduleDataCaches } from '@/lib/schedule-cache';
import { expandCollabWithCohorts, type CollabMember } from '@/lib/schedule-candidate-collab';
import { suggestGameIdFromText } from '@/constants/chzzkGameMap';
import {
  fetchAllGamesFromServer,
} from '@/lib/map-dyoa-server-games-feedback';
import type { ScheduleCandidate, ScheduleCandidateStatus } from '@prisma/client';

const DETAIL_CONCURRENCY = 4;

export type ScheduleCandidateView = ScheduleCandidate & {
  suggestedParticipants: CollabMember[];
  /** liveCategory·제목에서 추정한 게임 id (없으면 null) */
  suggestedGameId: string | null;
};

async function loadMemberStreamers(): Promise<
  { id: string; name: string; handle: string | null; chzzkUrl: string | null }[]
> {
  if (isScheduleServerEnabled()) {
    return (await fetchAllStreamersFromServer(false))
      .filter((s) => !s.isGuest && s.chzzkUrl)
      .map((s) => ({
        id: s.id,
        name: s.name,
        handle: s.handle ?? null,
        chzzkUrl: s.chzzkUrl,
      }));
  }
  return getPrismaForDomain().streamer.findMany({
    where: { isGuest: false, chzzkUrl: { not: null } },
    select: { id: true, name: true, handle: true, chzzkUrl: true },
  });
}

async function streamerIdsWithScheduleToday(dateKst: string): Promise<Set<string>> {
  const { start, end } = kstDayBounds(dateKst);
  const covered = new Set<string>();

  if (isScheduleServerEnabled()) {
    const schedules = await fetchSchedulesFromServer(start, end);
    for (const s of schedules) {
      for (const p of s.participants) covered.add(p.id);
    }
    return covered;
  }

  const rows = await getPrismaForDomain().schedule.findMany({
    where: {
      OR: [
        { startTime: { gte: start, lt: end } },
        { isGuerrilla: true, startTime: { gte: start, lt: end } },
      ],
    },
    select: {
      participants: { select: { streamerId: true } },
    },
  });
  for (const row of rows) {
    for (const p of row.participants) covered.add(p.streamerId);
  }
  return covered;
}

function toValidInstant(value: Date | string | number | null | undefined): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

/**
 * 일정 시작 시각: 같은 KST 날의 치지직 방송 시작(openDate) 우선.
 * 전날부터 이어진 방송은 오늘 날짜에 넣기 위해 fallback(스캔·감지 시각)을 쓴다.
 */
function resolveCandidateStartTime(
  openDate: Date | null,
  detectedAt: Date | string | null | undefined,
  dateKst: string,
  fallback: Date,
): Date {
  if (openDate && toKstDateKey(openDate) === dateKst) return openDate;
  const detected = toValidInstant(detectedAt);
  if (detected && toKstDateKey(detected) === dateKst) return detected;
  if (toKstDateKey(fallback) === dateKst) return fallback;
  return kstDayBounds(dateKst).start;
}

function liveUrlFor(chzzkUrl: string | null): string | null {
  if (!chzzkUrl) return null;
  const channelId = extractChzzkChannelId(chzzkUrl);
  if (!channelId) return chzzkUrl;
  return `https://chzzk.naver.com/live/${channelId}`;
}

function liveUrlsForMembers(
  participantIds: string[],
  members: { id: string; chzzkUrl: string | null }[],
  fallbackUrl: string | null,
): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  for (const id of participantIds) {
    const m = members.find((x) => x.id === id);
    const url = liveUrlFor(m?.chzzkUrl ?? null);
    if (url && !seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  }
  if (urls.length === 0 && fallbackUrl) urls.push(fallbackUrl);
  return urls;
}

/** LIVE인데 오늘 일정 없는 멤버 → PENDING 후보 upsert. 캘린더에는 쓰지 않음. */
export async function scanLiveScheduleCandidates(now = new Date()): Promise<{
  dateKst: string;
  liveCount: number;
  created: number;
  refreshed: number;
  skippedScheduled: number;
  skippedResolved: number;
}> {
  const dateKst = toKstDateKey(now);
  const [liveIds, members, scheduledIds] = await Promise.all([
    getLiveStreamerIds({ fresh: true }),
    loadMemberStreamers(),
    streamerIdsWithScheduleToday(dateKst),
  ]);

  const liveSet = new Set(liveIds);
  const candidates = members.filter((m) => liveSet.has(m.id) && !scheduledIds.has(m.id));
  const skippedScheduled = liveIds.filter((id) => scheduledIds.has(id)).length;

  const prisma = getPrisma();
  let created = 0;
  let refreshed = 0;
  let skippedResolved = 0;

  const details = await mapWithConcurrency(candidates, DETAIL_CONCURRENCY, async (m) => {
    const channelId = m.chzzkUrl ? extractChzzkChannelId(m.chzzkUrl) : null;
    const content = channelId ? await fetchChzzkLiveDetail(channelId) : null;
    const liveStart = parseChzzkOpenDate(content?.openDate);
    return {
      streamerId: m.id,
      streamerName: m.name,
      title: content?.liveTitle?.trim() || `${m.name} 라이브`,
      liveCategory: content?.liveCategory ?? null,
      liveUrl: liveUrlFor(m.chzzkUrl),
      liveStart,
    };
  });

  for (const d of details) {
    const existing = await prisma.scheduleCandidate.findUnique({
      where: {
        streamerId_dateKst: { streamerId: d.streamerId, dateKst },
      },
    });

    if (existing?.status === 'APPROVED' || existing?.status === 'DISMISSED') {
      skippedResolved += 1;
      continue;
    }

    if (existing) {
      const detectedAt = resolveCandidateStartTime(
        d.liveStart,
        existing.detectedAt,
        dateKst,
        now,
      );
      await prisma.scheduleCandidate.update({
        where: { id: existing.id },
        data: {
          title: d.title,
          liveCategory: d.liveCategory,
          liveUrl: d.liveUrl,
          streamerName: d.streamerName,
          lastSeenAt: now,
          detectedAt,
        },
      });
      refreshed += 1;
    } else {
      await prisma.scheduleCandidate.create({
        data: {
          streamerId: d.streamerId,
          streamerName: d.streamerName,
          dateKst,
          title: d.title,
          liveCategory: d.liveCategory,
          liveUrl: d.liveUrl,
          detectedAt: resolveCandidateStartTime(d.liveStart, null, dateKst, now),
          lastSeenAt: now,
        },
      });
      created += 1;
    }
  }

  return {
    dateKst,
    liveCount: liveIds.length,
    created,
    refreshed,
    skippedScheduled,
    skippedResolved,
  };
}

async function loadGames(): Promise<{ id: string; title: string }[]> {
  if (isScheduleServerEnabled()) {
    return (await fetchAllGamesFromServer()).map((g) => ({ id: g.id, title: g.title }));
  }
  return getPrismaForDomain().game.findMany({
    select: { id: true, title: true },
    orderBy: { title: 'asc' },
  });
}

function expiredCandidateWhere() {
  const cutoff = appDataRetentionCutoff();
  return {
    detectedAt: { gte: cutoff },
    lastSeenAt: { gte: cutoff },
    dateKst: { gte: toKstDateKey(cutoff) },
  };
}

export async function listScheduleCandidates(opts?: {
  status?: ScheduleCandidateStatus;
  limit?: number;
}): Promise<ScheduleCandidateView[]> {
  const prisma = getPrisma();
  const [rows, members, games] = await Promise.all([
    prisma.scheduleCandidate.findMany({
      where: {
        ...expiredCandidateWhere(),
        ...(opts?.status ? { status: opts.status } : {}),
      },
      orderBy: [{ status: 'asc' }, { lastSeenAt: 'desc' }],
      take: opts?.limit ?? 100,
    }),
    loadMemberStreamers().catch(() => [] as Awaited<ReturnType<typeof loadMemberStreamers>>),
    loadGames().catch(() => [] as { id: string; title: string }[]),
  ]);

  const collabMembers: CollabMember[] = members.map((m) => ({
    id: m.id,
    name: m.name,
    handle: m.handle,
  }));

  const pending = rows.filter((r) => r.status === 'PENDING');

  return rows.map((row) => {
    if (row.status !== 'PENDING') {
      return { ...row, suggestedParticipants: [], suggestedGameId: null };
    }
    const cohorts = pending
      .filter((p) => p.dateKst === row.dateKst)
      .map((p) => ({
        streamerId: p.streamerId,
        streamerName: p.streamerName,
        title: p.title,
      }));
    const suggested = expandCollabWithCohorts(
      row.streamerId,
      row.title ?? '',
      collabMembers,
      cohorts,
    );
    const suggestedGameId =
      suggestGameIdFromText(row.liveCategory, games) ??
      suggestGameIdFromText(row.title, games);
    return { ...row, suggestedParticipants: suggested, suggestedGameId };
  });
}

export async function countPendingScheduleCandidates(): Promise<number> {
  return getPrisma().scheduleCandidate.count({
    where: { status: 'PENDING', ...expiredCandidateWhere() },
  });
}

export async function dismissScheduleCandidate(id: string): Promise<void> {
  await getPrisma().scheduleCandidate.update({
    where: { id },
    data: { status: 'DISMISSED', resolvedAt: new Date() },
  });
}

/** 치지직 방송 시작(openDate) 또는 감지 시각을 startTime으로 일정 생성 후 APPROVED. */
export async function approveScheduleCandidate(
  id: string,
  opts?: { title?: string; participantIds?: string[]; gameId?: string | null },
): Promise<{ scheduleId: string }> {
  const prisma = getPrisma();
  const row = await prisma.scheduleCandidate.findUnique({ where: { id } });
  if (!row) throw new Error('후보를 찾을 수 없습니다.');
  if (row.status === 'APPROVED') {
    throw new Error('이미 등록된 후보입니다.');
  }
  if (row.status === 'DISMISSED') {
    throw new Error('이미 거절된 후보입니다.');
  }
  if (row.status !== 'PENDING') {
    throw new Error('이미 처리된 후보입니다.');
  }

  const members = await loadMemberStreamers();
  const memberIds = new Set(members.map((m) => m.id));

  const participantIds = [
    ...new Set([
      row.streamerId,
      ...(opts?.participantIds ?? []).filter((pid) => memberIds.has(pid)),
    ]),
  ];

  const channelId = row.liveUrl ? extractChzzkChannelId(row.liveUrl) : null;
  const liveContent = channelId ? await fetchChzzkLiveDetail(channelId) : null;
  const startTime = resolveCandidateStartTime(
    parseChzzkOpenDate(liveContent?.openDate),
    row.detectedAt,
    row.dateKst,
    new Date(),
  );
  const title =
    opts?.title?.trim() || row.title?.trim() || `${row.streamerName} 라이브`;
  if (!title) throw new Error('일정 제목을 입력해 주세요.');
  const liveUrls = liveUrlsForMembers(participantIds, members, row.liveUrl);
  const gameId = opts?.gameId?.trim() || undefined;

  const base = getScheduleServerBaseUrl();
  let scheduleId: string;

  if (base) {
    const res = await fetchWithBackoff(`${base}/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        startTime: startTime.toISOString(),
        participants: participantIds.map((pid) => ({ id: pid })),
        liveUrls,
        isGuerrilla: false,
        isNaeJeon: false,
        ...(gameId ? { gameId } : {}),
      }),
    });
    const json = (await res.json()) as { id?: string; error?: string; message?: string };
    if (!res.ok || !json.id) {
      throw new Error(json.message || json.error || '일정 생성에 실패했습니다.');
    }
    scheduleId = json.id;
  } else {
    const created = await getPrismaForDomain().schedule.create({
      data: {
        title,
        startTime,
        isGuerrilla: false,
        liveUrls,
        ...(gameId ? { game: { connect: { id: gameId } } } : {}),
        participants: {
          create: participantIds.map((pid) => ({
            streamer: { connect: { id: pid } },
          })),
        },
      },
    });
    scheduleId = created.id;
  }

  const now = new Date();
  await prisma.scheduleCandidate.update({
    where: { id },
    data: {
      status: 'APPROVED',
      title,
      detectedAt: startTime,
      resolvedAt: now,
      scheduleId,
    },
  });

  // 같은 날 PENDING인 합방 상대 후보도 같은 일정으로 묶어서 중복 등록 방지
  const siblingIds = participantIds.filter((pid) => pid !== row.streamerId);
  if (siblingIds.length > 0) {
    await prisma.scheduleCandidate.updateMany({
      where: {
        dateKst: row.dateKst,
        status: 'PENDING',
        streamerId: { in: siblingIds },
      },
      data: {
        status: 'APPROVED',
        resolvedAt: now,
        scheduleId,
        title,
      },
    });
  }

  await revalidateScheduleDataCaches();
  return { scheduleId };
}
