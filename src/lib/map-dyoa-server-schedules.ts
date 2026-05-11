/**
 * map-dyoa-server 일정 API (MAP_DYOA_SERVER_URL 설정 시 사용).
 * 예(로컬): http://localhost:3001 · 예(배포): https://map-dyoa-server.fly.dev
 *
 * 브라우저(클라이언트 컴포넌트)에서 부를 때는 CORS 대신 Next `rewrites`로
 * 동일 출처 `/map-dyoa-api/...` 프록시를 쓰거나, 백엔드 `CORS_ORIGINS`에 프론트 출처를 넣으면 됩니다.
 */

import type { FlattenedSchedule, ParticipantFlat } from '@/lib/schedule-formatters';
import type { Game } from '@prisma/client';
import { fetchWithBackoff, readJsonSafely } from '@/lib/map-dyoa-server-http-utils';

export function getScheduleServerBaseUrl(): string | null {
  const u = process.env.MAP_DYOA_SERVER_URL?.trim();
  if (!u) return null;
  return u.replace(/\/$/, '');
}

export function isScheduleServerEnabled(): boolean {
  return getScheduleServerBaseUrl() != null;
}

function hydrateParticipant(raw: Record<string, unknown>): ParticipantFlat {
  return {
    id: String(raw.id),
    name: String(raw.name),
    handle: String(raw.handle),
    generation: Number(raw.generation),
    role: raw.role != null ? String(raw.role) : null,
    platform: String(raw.platform ?? 'CHZZK'),
    profileImg: raw.profileImg != null ? String(raw.profileImg) : null,
    colorCode: String(raw.colorCode ?? '#673AB7'),
    chzzkUrl: raw.chzzkUrl != null ? String(raw.chzzkUrl) : null,
    bio: raw.bio != null ? String(raw.bio) : null,
    isGuest: Boolean(raw.isGuest),
    createdAt: new Date(String(raw.createdAt)),
    nation: raw.nation != null ? String(raw.nation) : null,
    result: raw.result != null ? String(raw.result) : null,
  };
}

export function hydrateFlattenedSchedule(raw: Record<string, unknown>): FlattenedSchedule {
  const participants = Array.isArray(raw.participants)
    ? (raw.participants as Record<string, unknown>[]).map(hydrateParticipant)
    : [];

  const gameRaw = raw.game;
  const game: Game | null =
    gameRaw && typeof gameRaw === 'object'
      ? ({
          id: String((gameRaw as { id: unknown }).id),
          title: String((gameRaw as { title: unknown }).title),
          isHoi4: Boolean((gameRaw as { isHoi4: unknown }).isHoi4),
        } as Game)
      : null;

  return {
    id: String(raw.id),
    title: String(raw.title),
    content: raw.content != null ? String(raw.content) : null,
    gameId: raw.gameId != null ? String(raw.gameId) : null,
    game,
    isGuerrilla: Boolean(raw.isGuerrilla),
    isNaeJeon: Boolean(raw.isNaeJeon),
    isLiveEnded: Boolean(raw.isLiveEnded),
    liveUrls: Array.isArray(raw.liveUrls) ? (raw.liveUrls as unknown[]).map(String) : [],
    startTime: new Date(String(raw.startTime)),
    endTime: raw.endTime != null ? new Date(String(raw.endTime)) : null,
    createdAt: new Date(String(raw.createdAt)),
    participants,
    formattedDate: String(raw.formattedDate ?? ''),
    formattedTime: String(raw.formattedTime ?? ''),
  };
}

export function hydrateFlattenedSchedules(raw: unknown[]): FlattenedSchedule[] {
  return raw.map((r) => hydrateFlattenedSchedule(r as Record<string, unknown>));
}

export async function fetchSchedulesFromServer(
  from: Date,
  to: Date,
): Promise<FlattenedSchedule[]> {
  const base = getScheduleServerBaseUrl();
  if (!base) throw new Error('MAP_DYOA_SERVER_URL이 설정되지 않았습니다.');

  const url = `${base}/schedules?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`;
  const res = await fetchWithBackoff(url, { next: { revalidate: 60 } });
  const data = await readJsonSafely<{
    schedules?: unknown[];
    error?: string;
    message?: string;
  }>(res, `일정 API ${res.status}`);

  if (!Array.isArray(data.schedules)) {
    throw new Error('일정 API 응답 형식이 올바르지 않습니다.');
  }
  return hydrateFlattenedSchedules(data.schedules);
}

/** 캘린더 등에서 쓰는 기본 조회 구간 (서버 부담과 커버 범위 균형) */
export function defaultScheduleFetchWindow(): { from: Date; to: Date } {
  const now = new Date();
  const from = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
  const to = new Date(now.getFullYear() + 2, 11, 31, 23, 59, 59, 999);
  return { from, to };
}

export async function fetchScheduleByIdFromServer(
  id: string,
): Promise<FlattenedSchedule | null> {
  const base = getScheduleServerBaseUrl();
  if (!base) throw new Error('MAP_DYOA_SERVER_URL이 설정되지 않았습니다.');

  const res = await fetchWithBackoff(`${base}/schedules/${encodeURIComponent(id)}`, {
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  const raw = await readJsonSafely<Record<string, unknown>>(
    res,
    `일정 API ${res.status}`,
  );
  if (raw.error === 'NOT_FOUND') return null;
  return hydrateFlattenedSchedule(raw);
}
