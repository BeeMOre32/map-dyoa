import { getPrisma, getPrismaForDomain } from '@/lib/prisma';
import { extractChzzkChannelId } from '@/lib/chzzk';
import { fetchChzzkLiveStatus, parseChzzkOpenDate } from '@/lib/chzzk-api';
import { fetchLiveChannels } from '@/lib/chzzk-live-status';
import { toKstDateKey, kstDayBounds } from '@/lib/backend-health';
import { appDataRetentionCutoff } from '@/lib/app-data-retention';
import {
  fetchScheduleByIdFromServer,
  fetchSchedulesFromServer,
  getScheduleServerBaseUrl,
  isScheduleServerEnabled,
} from '@/lib/map-dyoa-server-schedules';
import { fetchAllStreamersFromServer } from '@/lib/map-dyoa-server-streamers';
import { fetchWithBackoff } from '@/lib/map-dyoa-server-http-utils';
import { scheduleParticipantsForApi } from '@/lib/map-dyoa-server-fetch';
import { revalidateScheduleDataCaches } from '@/lib/schedule-cache';
import { expandCollabWithCohorts, type CollabMember } from '@/lib/schedule-candidate-collab';
import { suggestGameIdFromText } from '@/constants/chzzkGameMap';
import {
  fetchAllGamesFromServer,
} from '@/lib/map-dyoa-server-games-feedback';
import type { ScheduleCandidate, ScheduleCandidateStatus } from '@prisma/client';

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

/** 직전 스캔에서도 켜져 있던 방송만 자동 등록. 크론 간격(15분)보다 짧다. */
const AUTO_CONFIRM_MS = 10 * 60 * 1000;

function resolveAutoEndTime(lastSeenAt: Date, startTime: Date, now: Date): Date {
  const seen = toValidInstant(lastSeenAt) ?? now;
  if (seen.getTime() > startTime.getTime()) return seen;
  return now.getTime() > startTime.getTime() ? now : new Date(startTime.getTime() + 60_000);
}

/** 자동 등록 일정에 종료 시각·종료 표시만 기입. 이미 endTime이 있으면 건드리지 않음. */
async function markAutoScheduleEnded(
  scheduleId: string,
  endTime: Date,
): Promise<boolean> {
  const base = getScheduleServerBaseUrl();

  if (base) {
    const existing = await fetchScheduleByIdFromServer(scheduleId);
    if (!existing) return false;
    if (existing.endTime) return false;

    const resolvedEnd = resolveAutoEndTime(endTime, existing.startTime, endTime);
    const res = await fetchWithBackoff(`${base}/schedules/${encodeURIComponent(scheduleId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: existing.title,
        startTime: existing.startTime.toISOString(),
        endTime: resolvedEnd.toISOString(),
        participants: scheduleParticipantsForApi(
          existing.participants.map((p) => ({
            id: p.id,
            nation: p.nation ?? undefined,
            result: p.result ?? undefined,
            isGuest: p.isGuest,
          })),
        ),
        liveUrls: existing.liveUrls,
        isGuerrilla: existing.isGuerrilla,
        isNaeJeon: existing.isNaeJeon,
        isLiveEnded: true,
        ...(existing.gameId ? { gameId: existing.gameId } : {}),
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`일정 종료 반영 실패 (${res.status}): ${text.slice(0, 200)}`);
    }
  } else {
    const existing = await getPrismaForDomain().schedule.findUnique({
      where: { id: scheduleId },
      select: { endTime: true, startTime: true, isLiveEnded: true },
    });
    if (!existing) return false;
    if (existing.endTime) return false;

    const resolvedEnd = resolveAutoEndTime(endTime, existing.startTime, endTime);
    await getPrismaForDomain().schedule.update({
      where: { id: scheduleId },
      data: { endTime: resolvedEnd, isLiveEnded: true },
    });
  }

  await revalidateScheduleDataCaches();
  return true;
}

/**
 * 자동 등록(note=auto*) 일정: 아직 켜져 있으면 lastSeenAt 갱신,
 * 꺼졌으면 마지막 감지 시각을 endTime으로 기입하고 note=auto:ended.
 */
async function reconcileAutoScheduleEnds(
  liveIds: Set<string>,
  now: Date,
): Promise<{ liveTracked: number; endedMarked: number }> {
  const prisma = getPrisma();
  const todayKst = toKstDateKey(now);
  const yesterdayKst = toKstDateKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const rows = await prisma.scheduleCandidate.findMany({
    where: {
      status: 'APPROVED',
      note: 'auto',
      scheduleId: { not: null },
      dateKst: { in: [todayKst, yesterdayKst] },
      ...expiredCandidateWhere(),
    },
  });

  let liveTracked = 0;
  let endedMarked = 0;

  for (const row of rows) {
    if (!row.scheduleId) continue;

    if (liveIds.has(row.streamerId)) {
      await prisma.scheduleCandidate.update({
        where: { id: row.id },
        data: { lastSeenAt: now },
      });
      liveTracked += 1;
      continue;
    }

    try {
      const marked = await markAutoScheduleEnded(row.scheduleId, row.lastSeenAt);
      if (marked) {
        await prisma.scheduleCandidate.update({
          where: { id: row.id },
          data: { note: 'auto:ended' },
        });
        endedMarked += 1;
      } else {
        // 이미 종료 시각이 있으면 재시도하지 않음
        await prisma.scheduleCandidate.update({
          where: { id: row.id },
          data: { note: 'auto:ended' },
        });
      }
    } catch (error) {
      console.error('[schedule-candidate] end', row.streamerId, error);
    }
  }

  return { liveTracked, endedMarked };
}

/**
 * 두 번 이상 본 뒤 꺼진 PENDING: 일정으로 등록하면서 종료 시각도 기입.
 * (등록 직전 스캔에서 승인 실패한 경우 등)
 */
async function approveEndedPendingCandidates(
  liveIds: Set<string>,
  now: Date,
  dateKst: string,
): Promise<number> {
  const prisma = getPrisma();
  const rows = await prisma.scheduleCandidate.findMany({
    where: {
      status: 'PENDING',
      dateKst,
      ...expiredCandidateWhere(),
    },
  });

  let autoRegistered = 0;
  for (const row of rows) {
    if (liveIds.has(row.streamerId)) continue;
    if (row.lastSeenAt.getTime() - row.detectedAt.getTime() < AUTO_CONFIRM_MS) continue;
    try {
      await approveScheduleCandidate(row.id, {
        title: row.title ?? undefined,
        auto: true,
        endTime: row.lastSeenAt.getTime() > now.getTime() ? now : row.lastSeenAt,
      });
      autoRegistered += 1;
    } catch (error) {
      console.error('[schedule-candidate] end-approve', row.streamerId, error);
    }
  }
  return autoRegistered;
}

/** LIVE인데 오늘 일정 없는 멤버를 후보로 쌓고, 다음 스캔에도 켜져 있으면 혼자 일정으로 등록. */
export async function scanLiveScheduleCandidates(now = new Date()): Promise<{
  dateKst: string;
  liveCount: number;
  created: number;
  refreshed: number;
  autoRegistered: number;
  skippedScheduled: number;
  skippedResolved: number;
  liveTracked: number;
  endedMarked: number;
}> {
  const dateKst = toKstDateKey(now);
  const [liveChannels, members, scheduledIds] = await Promise.all([
    fetchLiveChannels(),
    loadMemberStreamers(),
    streamerIdsWithScheduleToday(dateKst),
  ]);

  const liveIds = liveChannels.map((c) => c.streamerId);
  const liveIdSet = new Set(liveIds);
  const statusById = new Map(liveChannels.map((c) => [c.streamerId, c.status]));
  const candidates = members.filter((m) => statusById.has(m.id) && !scheduledIds.has(m.id));
  const skippedScheduled = liveIds.filter((id) => scheduledIds.has(id)).length;

  const prisma = getPrisma();
  let created = 0;
  let refreshed = 0;
  let autoRegistered = 0;
  let skippedResolved = 0;

  const details = candidates.map((m) => {
    const content = statusById.get(m.id);
    return {
      streamerId: m.id,
      streamerName: m.name,
      title: content?.liveTitle?.trim() || `${m.name} 라이브`,
      liveCategory: content?.liveCategory ?? null,
      liveUrl: liveUrlFor(m.chzzkUrl),
      liveStart: parseChzzkOpenDate(content?.openDate),
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

    if (
      existing?.status === 'PENDING' &&
      now.getTime() - existing.lastSeenAt.getTime() >= AUTO_CONFIRM_MS
    ) {
      try {
        await approveScheduleCandidate(existing.id, { title: d.title, auto: true });
        autoRegistered += 1;
        continue;
      } catch (error) {
        console.error('[schedule-candidate] auto', d.streamerId, error);
      }
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

  const endedApproved = await approveEndedPendingCandidates(liveIdSet, now, dateKst);
  autoRegistered += endedApproved;

  const { liveTracked, endedMarked } = await reconcileAutoScheduleEnds(liveIdSet, now);

  return {
    dateKst,
    liveCount: liveIds.length,
    created,
    refreshed,
    skippedScheduled,
    skippedResolved,
    autoRegistered,
    liveTracked,
    endedMarked,
  };
}

export async function listAutoScheduleIds(): Promise<string[]> {
  const rows = await getPrisma().scheduleCandidate.findMany({
    where: {
      note: { startsWith: 'auto' },
      status: 'APPROVED',
      scheduleId: { not: null },
      ...expiredCandidateWhere(),
    },
    select: { scheduleId: true },
  });
  return rows.flatMap((row) => (row.scheduleId ? [row.scheduleId] : []));
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
  opts?: {
    title?: string;
    participantIds?: string[];
    gameId?: string | null;
    /** 확인된 방송만. 참여자는 본인, 게임·합방은 비운다. */
    auto?: boolean;
    /** 이미 끝난 방송을 등록할 때 종료 시각 */
    endTime?: Date;
  },
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

  const participantIds = opts?.auto
    ? [row.streamerId]
    : [
        ...new Set([
          row.streamerId,
          ...(opts?.participantIds ?? []).filter((pid) => memberIds.has(pid)),
        ]),
      ];

  const channelId = row.liveUrl ? extractChzzkChannelId(row.liveUrl) : null;
  const liveContent = channelId ? await fetchChzzkLiveStatus(channelId) : null;
  const startTime = resolveCandidateStartTime(
    parseChzzkOpenDate(liveContent?.openDate),
    row.detectedAt,
    row.dateKst,
    new Date(),
  );
  const endTime = opts?.endTime
    ? resolveAutoEndTime(opts.endTime, startTime, opts.endTime)
    : null;
  const title =
    opts?.title?.trim() || row.title?.trim() || `${row.streamerName} 라이브`;
  if (!title) throw new Error('일정 제목을 입력해 주세요.');
  const liveUrls = liveUrlsForMembers(participantIds, members, row.liveUrl);
  const gameId = opts?.auto ? undefined : opts?.gameId?.trim() || undefined;

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
    // 서버 create는 endTime을 안 받으므로 생성 후 PATCH
    if (endTime) {
      await markAutoScheduleEnded(scheduleId, endTime);
    }
  } else {
    const created = await getPrismaForDomain().schedule.create({
      data: {
        title,
        startTime,
        ...(endTime ? { endTime, isLiveEnded: true } : {}),
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
      ...(opts?.auto ? { note: endTime ? 'auto:ended' : 'auto' } : {}),
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
