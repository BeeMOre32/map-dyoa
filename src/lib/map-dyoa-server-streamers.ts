/**
 * map-dyoa-server 스트리머 API (`MAP_DYOA_SERVER_URL`).
 */

import type { Streamer } from '@prisma/client';
import { fetchWithBackoff } from './map-dyoa-server-http-utils';
import {
  type ApiJson,
  readApiJson,
  readJsonSafely,
  requireServerBaseUrl,
} from './map-dyoa-server-fetch';

export function hydrateStreamerFromApi(raw: Record<string, unknown>): Streamer {
  return {
    id: String(raw.id),
    name: String(raw.name),
    handle: String(raw.handle),
    generation: Number(raw.generation ?? 1),
    role: raw.role != null ? String(raw.role) : null,
    platform: String(raw.platform ?? 'CHZZK'),
    profileImg: raw.profileImg != null ? String(raw.profileImg) : null,
    colorCode: String(raw.colorCode ?? '#673AB7'),
    chzzkUrl: raw.chzzkUrl != null ? String(raw.chzzkUrl) : null,
    youtubeUrl: raw.youtubeUrl != null ? String(raw.youtubeUrl) : null,
    bio: raw.bio != null ? String(raw.bio) : null,
    isGuest: Boolean(raw.isGuest),
    createdAt: new Date(String(raw.createdAt)),
  };
}

export async function fetchAllStreamersFromServer(
  membersOnly: boolean,
): Promise<Streamer[]> {
  const base = requireServerBaseUrl();

  const qs = membersOnly ? '?membersOnly=1' : '';
  const res = await fetchWithBackoff(`${base}/streamers${qs}`, {
    next: { revalidate: 120, tags: ['streamers'] },
  });
  const data = await readJsonSafely<{ streamers?: unknown[]; message?: string }>(
    res,
    `스트리머 API ${res.status}`,
  );
  if (!Array.isArray(data.streamers)) {
    throw new Error('스트리머 API 응답 형식이 올바르지 않습니다.');
  }
  return (data.streamers as Record<string, unknown>[]).map(hydrateStreamerFromApi);
}

export async function fetchStreamerByIdFromServer(
  streamerId: string,
  opts?: { noCache?: boolean },
): Promise<Streamer | null> {
  const base = requireServerBaseUrl();

  const res = await fetchWithBackoff(`${base}/streamers/${encodeURIComponent(streamerId)}`, opts?.noCache
    ? { cache: 'no-store' }
    : { next: { revalidate: 120, tags: ['streamers'] } });
  if (res.status === 404) return null;
  const raw = await readJsonSafely<Record<string, unknown>>(
    res,
    `스트리머 API ${res.status}`,
  );
  if (raw.error === 'NOT_FOUND') return null;
  return hydrateStreamerFromApi(raw);
}

function hydrateScheduleDetailItem(raw: Record<string, unknown>) {
  const gameRaw = raw.game;
  const game =
    gameRaw && typeof gameRaw === 'object'
      ? {
          id: String((gameRaw as Record<string, unknown>).id),
          title: String((gameRaw as Record<string, unknown>).title),
          isHoi4: Boolean((gameRaw as Record<string, unknown>).isHoi4),
        }
      : null;

  const participants = Array.isArray(raw.participants)
    ? (raw.participants as Record<string, unknown>[]).map((p) => {
        const s = p.streamer as Record<string, unknown> | undefined;
        return {
          nation: p.nation != null ? String(p.nation) : null,
          result: p.result != null ? String(p.result) : null,
          isGuest: Boolean(p.isGuest),
          streamer: {
            id: String(s?.id ?? ''),
            name: String(s?.name ?? ''),
            colorCode: String(s?.colorCode ?? '#673AB7'),
          },
        };
      })
    : [];

  return {
    id: String(raw.id),
    title: String(raw.title),
    startTime: new Date(String(raw.startTime)),
    game,
    participants,
  };
}

function hydrateLinkedClipItem(raw: Record<string, unknown>) {
  const participants = Array.isArray(raw.participants)
    ? (raw.participants as Record<string, unknown>[]).map((p) => {
        const s = p.streamer as Record<string, unknown> | undefined;
        return {
          streamer: {
            id: String(s?.id ?? ''),
            name: String(s?.name ?? ''),
            colorCode: String(s?.colorCode ?? '#673AB7'),
          },
        };
      })
    : [];

  const schedRaw = raw.schedule;
  const schedule =
    schedRaw && typeof schedRaw === 'object'
      ? (() => {
          const sch = schedRaw as Record<string, unknown>;
          const g = sch.game;
          const game =
            g && typeof g === 'object'
              ? {
                  id: String((g as Record<string, unknown>).id),
                  title: String((g as Record<string, unknown>).title),
                }
              : null;
          return {
            id: String(sch.id),
            title: String(sch.title),
            game,
          };
        })()
      : null;

  return {
    id: String(raw.id),
    title: String(raw.title),
    url: String(raw.url),
    thumbnailUrl: raw.thumbnailUrl != null ? String(raw.thumbnailUrl) : null,
    clipDate: raw.clipDate != null ? new Date(String(raw.clipDate)) : null,
    participants,
    schedule,
  };
}

export type StreamerDetailBundle = {
  schedules: ReturnType<typeof hydrateScheduleDetailItem>[];
  linkedClips: ReturnType<typeof hydrateLinkedClipItem>[];
  scheduleCount: number;
  clipCount: number;
};

export async function fetchStreamerDetailFromServer(
  streamerId: string,
): Promise<StreamerDetailBundle> {
  const base = requireServerBaseUrl();

  const res = await fetchWithBackoff(
    `${base}/streamers/${encodeURIComponent(streamerId)}/detail`,
    { next: { revalidate: 120, tags: ['streamers', 'calendar', 'clips'] } },
  );

  if (res.status === 404) {
    return { schedules: [], linkedClips: [], scheduleCount: 0, clipCount: 0 };
  }
  const data = await readJsonSafely<{
    error?: string;
    schedules?: unknown[];
    linkedClips?: unknown[];
    scheduleCount?: number;
    clipCount?: number;
  }>(res, `스트리머 상세 API ${res.status}`);

  if (data.error === 'NOT_FOUND') {
    return { schedules: [], linkedClips: [], scheduleCount: 0, clipCount: 0 };
  }

  const schedules = Array.isArray(data.schedules)
    ? (data.schedules as Record<string, unknown>[]).map(hydrateScheduleDetailItem)
    : [];
  const linkedClips = Array.isArray(data.linkedClips)
    ? (data.linkedClips as Record<string, unknown>[]).map(hydrateLinkedClipItem)
    : [];

  return {
    schedules,
    linkedClips,
    scheduleCount: typeof data.scheduleCount === 'number' ? data.scheduleCount : 0,
    clipCount: typeof data.clipCount === 'number' ? data.clipCount : 0,
  };
}

export type StreamerMutationBody = {
  name: string;
  handle: string;
  generation: number;
  role?: string;
  platform: string;
  profileImg?: string;
  colorCode: string;
  chzzkUrl?: string;
  youtubeUrl?: string;
  bio?: string;
  isGuest?: boolean;
};

function streamerJsonBody(body: StreamerMutationBody): Record<string, unknown> {
  return {
    name: body.name.trim(),
    handle: body.handle.trim().toLowerCase(),
    generation: body.generation,
    role: body.role?.trim() || undefined,
    platform: body.platform,
    profileImg: body.profileImg?.trim() || undefined,
    colorCode: body.colorCode,
    chzzkUrl: body.chzzkUrl?.trim() || null,
    youtubeUrl: body.youtubeUrl?.trim() || null,
    bio: body.bio?.trim() || undefined,
    isGuest: body.isGuest ?? false,
  };
}

type StreamerMutationFail = { ok: false; status: number; json: ApiJson };

export async function createStreamerOnServer(
  body: StreamerMutationBody,
): Promise<{ ok: true; id: string } | StreamerMutationFail> {
  const base = requireServerBaseUrl();
  const res = await fetchWithBackoff(`${base}/streamers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(streamerJsonBody(body)),
  });
  const json = await readApiJson(res);
  if (res.status === 201 && typeof json.id === 'string') {
    return { ok: true, id: json.id };
  }
  return { ok: false, status: res.status, json };
}

export async function updateStreamerOnServer(
  streamerId: string,
  body: StreamerMutationBody,
): Promise<{ ok: true } | StreamerMutationFail> {
  const base = requireServerBaseUrl();
  const res = await fetchWithBackoff(`${base}/streamers/${encodeURIComponent(streamerId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(streamerJsonBody(body)),
  });
  const json = await readApiJson(res);
  if (res.ok) return { ok: true };
  return { ok: false, status: res.status, json };
}

export async function bulkCreateStreamersOnServer(
  streamers: StreamerMutationBody[],
): Promise<{ ok: true; created: number } | StreamerMutationFail> {
  const base = requireServerBaseUrl();
  const res = await fetchWithBackoff(`${base}/streamers/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      streamers: streamers.map((s) => streamerJsonBody(s)),
    }),
  });
  const json = await readApiJson(res);
  if (res.status === 201 && typeof json.created === 'number') {
    return { ok: true, created: json.created };
  }
  return { ok: false, status: res.status, json };
}
