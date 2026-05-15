/**
 * map-dyoa-server 클립 API (`MAP_DYOA_SERVER_URL`).
 */

import type { ClipParticipant, Game, Streamer } from '@prisma/client';
import type { ClipWithParticipants } from '@/types/entities';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';
import { fetchWithBackoff } from './map-dyoa-server-http-utils';
import {
  type ApiJson,
  readApiJson,
  readJsonSafely,
  requireServerBaseUrl,
} from './map-dyoa-server-fetch';

function hydrateStreamerFromClipApi(s: Record<string, unknown>): Streamer {
  return {
    id: String(s.id),
    name: String(s.name),
    handle: String(s.handle),
    generation: Number(s.generation ?? 0),
    role: s.role != null ? String(s.role) : null,
    platform: String(s.platform ?? 'CHZZK'),
    profileImg: s.profileImg != null ? String(s.profileImg) : null,
    colorCode: String(s.colorCode ?? '#673AB7'),
    chzzkUrl: s.chzzkUrl != null ? String(s.chzzkUrl) : null,
    bio: s.bio != null ? String(s.bio) : null,
    isGuest: Boolean(s.isGuest),
    createdAt: new Date(String(s.createdAt)),
  };
}

function hydrateClipParticipant(raw: Record<string, unknown>): ClipParticipant & { streamer: Streamer } {
  const streamerRaw = raw.streamer;
  const streamer =
    streamerRaw && typeof streamerRaw === 'object'
      ? hydrateStreamerFromClipApi(streamerRaw as Record<string, unknown>)
      : ({
          id: '',
          name: '',
          handle: '',
          generation: 0,
          role: null,
          platform: 'CHZZK',
          profileImg: null,
          colorCode: '#673AB7',
          chzzkUrl: null,
          bio: null,
          isGuest: false,
          createdAt: new Date(0),
        } satisfies Streamer);

  return {
    id: String(raw.id),
    clipId: String(raw.clipId),
    streamerId: String(raw.streamerId),
    streamer,
  };
}

function hydrateScheduleBriefForClip(raw: Record<string, unknown>): NonNullable<ClipWithParticipants['schedule']> {
  const gRaw = raw.game;
  const game =
    gRaw && typeof gRaw === 'object'
      ? ({
          id: String((gRaw as Record<string, unknown>).id),
          title: String((gRaw as Record<string, unknown>).title),
          isHoi4: Boolean((gRaw as Record<string, unknown>).isHoi4),
        } as Game)
      : null;
  return {
    id: String(raw.id),
    title: String(raw.title),
    game,
  };
}

/** 목록/일정 클립 API 공통: 클립 본문 + 참가자; `raw.schedule` 있으면 병합 */
export function hydrateClipApiRow(raw: Record<string, unknown>): ClipWithParticipants {
  const participants = Array.isArray(raw.participants)
    ? (raw.participants as Record<string, unknown>[]).map(hydrateClipParticipant)
    : [];

  const schedRaw = raw.schedule;
  const schedule =
    schedRaw && typeof schedRaw === 'object'
      ? hydrateScheduleBriefForClip(schedRaw as Record<string, unknown>)
      : null;

  return {
    id: String(raw.id),
    title: String(raw.title),
    url: String(raw.url),
    thumbnailUrl: raw.thumbnailUrl != null ? String(raw.thumbnailUrl) : null,
    description: raw.description != null ? String(raw.description) : null,
    clipDate: (() => {
      if (raw.clipDate == null) return null;
      const d = new Date(String(raw.clipDate));
      return Number.isNaN(d.getTime()) ? null : d;
    })(),
    scheduleId: raw.scheduleId != null ? String(raw.scheduleId) : null,
    createdAt: (() => {
      const d = new Date(String(raw.createdAt));
      return Number.isNaN(d.getTime()) ? new Date(0) : d;
    })(),
    participants,
    schedule,
  } as ClipWithParticipants;
}

function mergeScheduleFromCalendar(
  clip: ClipWithParticipants,
  schedules: FlattenedSchedule[],
): ClipWithParticipants {
  if (clip.schedule || !clip.scheduleId) return clip;
  const s = schedules.find((x) => x.id === clip.scheduleId);
  if (!s) return clip;
  const game = s.game
    ? ({ id: s.game.id, title: s.game.title, isHoi4: s.game.isHoi4 } as Game)
    : null;
  return {
    ...clip,
    schedule: { id: s.id, title: s.title, game },
  } as ClipWithParticipants;
}

export type FetchClipsPaginatedServerArgs = {
  page: number;
  pageSize: number;
  streamerId?: string;
  month?: string;
  q?: string;
  sort: string;
  /** `GET /clips?clipsOnly=1` — 일정 조인 생략 후 `schedulesForClipLinks`로 방송 링크 복원 */
  clipsOnly: boolean;
  schedulesForClipLinks?: FlattenedSchedule[];
};

export async function fetchClipsPaginatedFromServer(
  args: FetchClipsPaginatedServerArgs,
): Promise<{ clips: ClipWithParticipants[]; total: number; totalPages: number }> {
  const base = requireServerBaseUrl();

  const qs = new URLSearchParams();
  qs.set('page', String(args.page));
  qs.set('pageSize', String(args.pageSize));
  qs.set('sort', args.sort);
  if (args.streamerId) qs.set('streamer', args.streamerId);
  if (args.month) qs.set('month', args.month);
  if (args.q) qs.set('q', args.q);
  if (args.clipsOnly) qs.set('clipsOnly', '1');

  const res = await fetchWithBackoff(`${base}/clips?${qs.toString()}`, {
    cache: 'no-store',
  });
  const data = await readJsonSafely<{
    clips?: unknown[];
    total?: number;
    totalPages?: number;
    message?: string;
  }>(res, `클립 API ${res.status}`);
  if (!Array.isArray(data.clips)) {
    throw new Error('클립 API 응답 형식이 올바르지 않습니다.');
  }

  let clips = (data.clips as Record<string, unknown>[]).map(hydrateClipApiRow);
  if (args.clipsOnly && args.schedulesForClipLinks?.length) {
    clips = clips.map((c) => mergeScheduleFromCalendar(c, args.schedulesForClipLinks!));
  }

  const total = typeof data.total === 'number' ? data.total : clips.length;
  const totalPages =
    typeof data.totalPages === 'number'
      ? data.totalPages
      : total === 0
        ? 0
        : Math.ceil(total / args.pageSize);

  return { clips, total, totalPages };
}

/** `GET /clips/months` — 필터 드롭다운용 연-월 목록 */
export async function fetchClipMonthsFromServer(): Promise<string[]> {
  const base = requireServerBaseUrl();
  const res = await fetchWithBackoff(`${base}/clips/months`, {
    next: { revalidate: 60 },
  });
  const data = await readJsonSafely<{ months?: unknown[] }>(
    res,
    `클립 월 목록 API ${res.status}`,
  );
  if (!Array.isArray(data.months)) {
    return [];
  }
  return (data.months as unknown[])
    .map((m) => String(m))
    .filter((s) => /^\d{4}-\d{2}$/.test(s));
}

const SCHEDULE_CLIPS_PAGE_SIZE = 100;
const SCHEDULE_CLIPS_MAX_PAGES = 200;

/** `GET /schedules/:id/clips` 페이지를 모아 Prisma `getScheduleClips`와 동일한 배열 */
export async function fetchScheduleClipsFromServer(
  scheduleId: string,
): Promise<ClipWithParticipants[]> {
  const base = requireServerBaseUrl();

  const out: ClipWithParticipants[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const res = await fetchWithBackoff(
      `${base}/schedules/${encodeURIComponent(scheduleId)}/clips?page=${page}&pageSize=${SCHEDULE_CLIPS_PAGE_SIZE}`,
      { next: { revalidate: 60 } },
    );
    const data = await readJsonSafely<{
      clips?: unknown[];
      totalPages?: number;
    }>(res, `일정 클립 API ${res.status}`);
    if (!Array.isArray(data.clips)) {
      throw new Error('일정 클립 API 응답 형식이 올바르지 않습니다.');
    }
    totalPages =
      typeof data.totalPages === 'number' && data.totalPages >= 0
        ? data.totalPages
        : Array.isArray(data.clips) && data.clips.length > 0
          ? 1
          : 0;

    for (const row of data.clips as Record<string, unknown>[]) {
      out.push(hydrateClipApiRow(row));
    }

    page++;
  } while (page <= totalPages && page <= SCHEDULE_CLIPS_MAX_PAGES);

  return out;
}

export type ClipMutationBody = {
  title: string;
  url: string;
  streamerIds: string[];
  thumbnailUrl?: string;
  description?: string;
  clipDate?: Date | null;
  scheduleId?: string;
};

function clipJsonBody(body: ClipMutationBody): Record<string, unknown> {
  return {
    title: body.title.trim(),
    url: body.url.trim(),
    streamerIds: body.streamerIds,
    thumbnailUrl: body.thumbnailUrl?.trim() || undefined,
    description: body.description?.trim() || undefined,
    clipDate: body.clipDate ?? null,
    scheduleId: body.scheduleId?.trim() || undefined,
  };
}

type ClipMutationFail = { ok: false; status: number; json: ApiJson };

export async function createClipOnServer(
  body: ClipMutationBody,
): Promise<{ ok: true; id: string } | ClipMutationFail> {
  const base = requireServerBaseUrl();
  const res = await fetchWithBackoff(`${base}/clips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clipJsonBody(body)),
  });
  const json = await readApiJson(res);
  if (res.status === 201 && typeof json.id === 'string') {
    return { ok: true, id: json.id };
  }
  return { ok: false, status: res.status, json };
}

export async function updateClipOnServer(
  clipId: string,
  body: ClipMutationBody,
): Promise<{ ok: true } | ClipMutationFail> {
  const base = requireServerBaseUrl();
  const res = await fetchWithBackoff(`${base}/clips/${encodeURIComponent(clipId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clipJsonBody(body)),
  });
  const json = await readApiJson(res);
  if (res.ok) return { ok: true };
  return { ok: false, status: res.status, json };
}

export async function deleteClipOnServer(
  clipId: string,
): Promise<{ ok: true } | ClipMutationFail> {
  const base = requireServerBaseUrl();
  const res = await fetchWithBackoff(`${base}/clips/${encodeURIComponent(clipId)}`, {
    method: 'DELETE',
  });
  const json = await readApiJson(res);
  if (res.ok) return { ok: true };
  return { ok: false, status: res.status, json };
}
