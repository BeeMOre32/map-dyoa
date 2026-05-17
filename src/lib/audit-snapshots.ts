import { getPrismaForDomain } from '@/lib/prisma';
import {
  fetchScheduleByIdFromServer,
  getScheduleServerBaseUrl,
} from '@/lib/map-dyoa-server-schedules';
import { fetchStreamerByIdFromServer } from '@/lib/map-dyoa-server-streamers';
import { fetchWithBackoff } from '@/lib/map-dyoa-server-http-utils';
import { hydrateClipApiRow } from '@/lib/map-dyoa-server-clips';
import { readJsonSafely, requireServerBaseUrl } from '@/lib/map-dyoa-server-fetch';
import {
  snapshotClip,
  snapshotGame,
  snapshotSchedule,
  snapshotStreamer,
} from '@/lib/audit-log';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';

export function snapshotScheduleFromFlattened(schedule: FlattenedSchedule) {
  return snapshotSchedule({
    title: schedule.title,
    startTime: schedule.startTime,
    participants: schedule.participants.map((p) => ({ id: p.id })),
    gameId: schedule.gameId ?? undefined,
    liveUrls: schedule.liveUrls ?? [],
    isGuerrilla: schedule.isGuerrilla,
    isNaeJeon: schedule.isNaeJeon,
    isLiveEnded: schedule.isLiveEnded,
  });
}

export async function loadScheduleSnapshotBefore(
  id: string,
): Promise<Record<string, unknown>> {
  const base = getScheduleServerBaseUrl();
  if (base) {
    const schedule = await fetchScheduleByIdFromServer(id);
    return schedule ? snapshotScheduleFromFlattened(schedule) : {};
  }

  const row = await getPrismaForDomain().schedule.findUnique({
    where: { id },
    include: { participants: { select: { streamerId: true } } },
  });
  if (!row) return {};

  return snapshotSchedule({
    title: row.title,
    startTime: row.startTime,
    participants: row.participants.map((p) => ({ id: p.streamerId })),
    gameId: row.gameId ?? undefined,
    liveUrls: row.liveUrls,
    isGuerrilla: row.isGuerrilla,
    isNaeJeon: row.isNaeJeon,
    isLiveEnded: row.isLiveEnded,
  });
}

export async function loadStreamerSnapshotBefore(
  id: string,
): Promise<Record<string, unknown>> {
  const base = getScheduleServerBaseUrl();
  if (base) {
    const row = await fetchStreamerByIdFromServer(id);
    if (!row) return {};
    return snapshotStreamer({
      name: row.name,
      handle: row.handle,
      generation: row.generation,
      platform: row.platform,
      isGuest: row.isGuest,
    });
  }

  const row = await getPrismaForDomain().streamer.findUnique({ where: { id } });
  if (!row) return {};
  return snapshotStreamer({
    name: row.name,
    handle: row.handle,
    generation: row.generation,
    platform: row.platform,
    isGuest: row.isGuest,
  });
}

async function fetchClipByIdFromServer(clipId: string) {
  const base = requireServerBaseUrl();
  const res = await fetchWithBackoff(`${base}/clips/${encodeURIComponent(clipId)}`, {
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  const raw = await readJsonSafely<Record<string, unknown>>(res, `클립 API ${res.status}`);
  if (raw.error === 'NOT_FOUND') return null;
  return hydrateClipApiRow(raw);
}

export async function loadClipSnapshotBefore(
  id: string,
): Promise<Record<string, unknown>> {
  const base = getScheduleServerBaseUrl();
  if (base) {
    const clip = await fetchClipByIdFromServer(id);
    if (!clip) return {};
    return snapshotClip({
      title: clip.title,
      url: clip.url,
      streamerIds: clip.participants.map((p) => p.streamerId),
      scheduleId: clip.scheduleId ?? undefined,
      clipDate: clip.clipDate,
    });
  }

  const row = await getPrismaForDomain().clip.findUnique({
    where: { id },
    include: { participants: { select: { streamerId: true } } },
  });
  if (!row) return {};

  return snapshotClip({
    title: row.title,
    url: row.url,
    streamerIds: row.participants.map((p) => p.streamerId),
    scheduleId: row.scheduleId ?? undefined,
    clipDate: row.clipDate,
  });
}

export async function loadGameSnapshotBefore(
  id: string,
): Promise<Record<string, unknown>> {
  const row = await getPrismaForDomain().game.findUnique({ where: { id } });
  if (!row) return {};
  return snapshotGame({ title: row.title, isHoi4: row.isHoi4 });
}
