// src/app/actions.ts
'use server';

import { getPrisma, getPrismaForDomain } from '@/lib/prisma';
import { revalidatePath, updateTag } from 'next/cache';
import { requireAdmin, requireAuth } from '@/lib/auth-helpers';
import { ActionResult } from '@/types/api-response';
import {
  ValidationError,
  ScheduleConflictError,
  getErrorMessage,
  logError,
} from '@/lib/error-handling';
import {
  actorFromSession,
  buildAuditDiff,
  logMutation,
  snapshotClip,
  snapshotFeedback,
  snapshotGame,
  snapshotSchedule,
  snapshotStreamer,
} from '@/lib/audit-log';
import {
  loadClipSnapshotBefore,
  loadGameSnapshotBefore,
  loadScheduleSnapshotBefore,
  loadStreamerSnapshotBefore,
} from '@/lib/audit-snapshots';
import type { Session } from 'next-auth';
import { Prisma } from '@prisma/client';
import {
  getRevalidationPaths,
  getRevalidationPathsMulti,
} from '@/constants/revalidation-paths';
import { fetchWithBackoff } from '@/lib/map-dyoa-server-http-utils';
import {
  createClipOnServer,
  deleteClipOnServer,
  updateClipOnServer,
} from '@/lib/map-dyoa-server-clips';
import {
  apiMutationMessage,
  scheduleParticipantsForApi,
  type ApiJson,
} from '@/lib/map-dyoa-server-fetch';
import {
  getScheduleServerBaseUrl,
  fetchScheduleByIdFromServer,
} from '@/lib/map-dyoa-server-schedules';
import { fetchAllGamesFromServer } from '@/lib/map-dyoa-server-games-feedback';
import {
  SCHEDULE_CONFLICT_MESSAGE,
  pickScheduleRevision,
  scheduleRevisionsMatch,
} from '@/lib/schedule-concurrency';
import {
  bulkCreateStreamersOnServer,
  createStreamerOnServer,
  fetchStreamerByIdFromServer,
  updateStreamerOnServer,
} from '@/lib/map-dyoa-server-streamers';
import { runDeleteSchedule } from '@/lib/schedule-delete-server';
import { revalidateScheduleDataCaches } from '@/lib/schedule-cache';
import { submitFeedbackCore } from '@/lib/feedback-submit';
import { externalUrlsEquivalent } from '@/lib/external-url';
import {
  scheduleServerSchema,
  clipServerSchema,
  feedbackSchema,
  streamerServerSchema,
} from '@/lib/schemas';
import type { CreateStreamerInput } from '@/types/models';

const YOUTUBE_NOT_PERSISTED_MSG =
  '유튜브 주소가 DB에 저장되지 않았습니다. `npm run db:ensure-youtube-column` 실행 후 map-dyoa-server(Fly) 최신 배포 여부를 확인해주세요.';

async function verifyStreamerYoutubeSaved(
  streamerId: string,
  expectedYoutube: string | null | undefined,
  viaServer: boolean,
): Promise<ActionResult | null> {
  const expected = expectedYoutube?.trim() || null;
  if (!expected) return null;

  if (viaServer) {
    const saved = await fetchStreamerByIdFromServer(streamerId, { noCache: true });
    if (!externalUrlsEquivalent(expected, saved?.youtubeUrl)) {
      return {
        success: false,
        error: YOUTUBE_NOT_PERSISTED_MSG,
        errorCode: 'YOUTUBE_NOT_PERSISTED',
      };
    }
    return null;
  }

  const saved = await getPrismaForDomain().streamer.findUnique({
    where: { id: streamerId },
    select: { youtubeUrl: true },
  });
  if (!externalUrlsEquivalent(expected, saved?.youtubeUrl)) {
    return {
      success: false,
      error: YOUTUBE_NOT_PERSISTED_MSG,
      errorCode: 'YOUTUBE_NOT_PERSISTED',
    };
  }
  return null;
}

function streamerUniqueConstraintFailure(
  error: unknown,
): ActionResult | null {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== 'P2002'
  ) {
    return null;
  }
  const raw = error.meta?.target;
  const parts = Array.isArray(raw) ? raw.map(String) : raw != null ? [String(raw)] : [];
  const joined = parts.join(' ');
  const fieldLabel = joined.includes('handle')
    ? '영문 ID'
    : joined.includes('name')
      ? '이름'
      : '식별값';
  return {
    success: false,
    error: `이미 사용 중인 ${fieldLabel}입니다.`,
    errorCode: 'DUPLICATE_ENTRY',
  };
}

function auditLog(
  session: Session | null,
  opts: Omit<Parameters<typeof logMutation>[0], 'actor'>,
) {
  logMutation({ ...opts, actor: session ? actorFromSession(session) : undefined });
}

/**
 * 일정 생성
 */
export async function createScheduleAction(data: {
  title: string;
  startTime: Date;
  participants: { id: string; nation?: string; result?: string; isGuest?: boolean }[];
  gameId?: string;
  liveUrls?: string[];
  isGuerrilla?: boolean;
  isNaeJeon?: boolean;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();
    const validated = scheduleServerSchema.parse(data);
    const changes = snapshotSchedule(validated);

    const base = getScheduleServerBaseUrl();
    if (base) {
      const res = await fetchWithBackoff(`${base}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: validated.title.trim(),
          startTime: validated.startTime.toISOString(),
          participants: scheduleParticipantsForApi(validated.participants),
          gameId: validated.gameId?.trim() || undefined,
          liveUrls: validated.liveUrls?.map((u) => u.trim()).filter(Boolean) ?? [],
          isGuerrilla: validated.isGuerrilla ?? false,
          isNaeJeon: validated.isNaeJeon ?? false,
        }),
      });
      const json = (await res.json()) as ApiJson & { id?: string };
      if (!res.ok) {
        const msg = apiMutationMessage(
          res.status,
          json,
          '일정 저장에 실패했습니다.',
        );
        return { success: false, error: msg, errorCode: String(json.error ?? 'API_ERROR') };
      }
      if (!json.id) {
        return { success: false, error: '응답에 일정 ID가 없습니다.', errorCode: 'API_ERROR' };
      }
      await revalidateScheduleDataCaches();
      auditLog(session, {
        action: 'create',
        entity: 'schedule',
        entityId: json.id,
        summary: `일정 생성: ${validated.title.trim()}`,
        changes,
      });
      return { success: true, data: { id: json.id } };
    }

    const created = await getPrismaForDomain().schedule.create({
      data: {
        title: validated.title.trim(),
        startTime: validated.startTime,
        participants: {
          create: validated.participants.map(({ id, nation, result, isGuest }) => ({
            streamer: { connect: { id } },
            nation: nation?.trim() || null,
            result: result?.trim() || null,
            isGuest: isGuest ?? false,
          })),
        },
        ...(validated.gameId ? { game: { connect: { id: validated.gameId } } } : {}),
        liveUrls: validated.liveUrls?.map((u) => u.trim()).filter(Boolean) ?? [],
        isGuerrilla: validated.isGuerrilla ?? false,
        isNaeJeon: validated.isNaeJeon ?? false,
      },
    });

    await revalidateScheduleDataCaches();

    auditLog(session, {
      action: 'create',
      entity: 'schedule',
      entityId: created.id,
      summary: `일정 생성: ${validated.title.trim()}`,
      changes,
    });
    return { success: true, data: { id: created.id } };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('createSchedule', error);
    return { success: false, error: message, errorCode: code };
  }
}

/**
 * 일정 삭제
 */
export async function deleteScheduleAction(id: string): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    await runDeleteSchedule(id);
    auditLog(session, {
      action: 'delete',
      entity: 'schedule',
      entityId: id,
      summary: `일정 삭제 id=${id}`,
    });
    return { success: true, data: null };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('deleteSchedule', error);
    return { success: false, error: message, errorCode: code };
  }
}

/**
 * 일정 수정
 */
export async function updateScheduleAction(
  id: string,
  data: {
    title: string;
    startTime: Date;
    participants: { id: string; nation?: string; result?: string; isGuest?: boolean }[];
    gameId?: string;
    liveUrls?: string[];
    isGuerrilla?: boolean;
    isNaeJeon?: boolean;
    isLiveEnded?: boolean;
    expectedUpdatedAt?: Date;
  },
): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    const validated = scheduleServerSchema.parse(data);
    const before = await loadScheduleSnapshotBefore(id);
    const after = snapshotSchedule(validated);
    const changes = buildAuditDiff(before, after);

    const base = getScheduleServerBaseUrl();
    if (base) {
      if (validated.expectedUpdatedAt) {
        const fresh = await fetchScheduleByIdFromServer(id);
        if (!fresh) {
          return { success: false, error: '일정을 찾을 수 없습니다.', errorCode: 'NOT_FOUND' };
        }
        if (
          !scheduleRevisionsMatch(
            validated.expectedUpdatedAt,
            pickScheduleRevision(fresh),
          )
        ) {
          return {
            success: false,
            error: SCHEDULE_CONFLICT_MESSAGE,
            errorCode: 'CONFLICT',
          };
        }
      }

      const res = await fetchWithBackoff(`${base}/schedules/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: validated.title.trim(),
          startTime: validated.startTime.toISOString(),
          participants: scheduleParticipantsForApi(validated.participants),
          gameId: validated.gameId?.trim() || undefined,
          liveUrls: validated.liveUrls?.map((u) => u.trim()).filter(Boolean) ?? [],
          isGuerrilla: validated.isGuerrilla ?? false,
          isNaeJeon: validated.isNaeJeon ?? false,
          isLiveEnded: validated.isLiveEnded ?? false,
          ...(validated.expectedUpdatedAt
            ? { expectedUpdatedAt: validated.expectedUpdatedAt.toISOString() }
            : {}),
        }),
      });
      const json = (await res.json()) as ApiJson;
      if (res.status === 404) {
        return { success: false, error: '일정을 찾을 수 없습니다.', errorCode: 'NOT_FOUND' };
      }
      if (res.status === 409 || json.error === 'CONFLICT') {
        return {
          success: false,
          error: SCHEDULE_CONFLICT_MESSAGE,
          errorCode: 'CONFLICT',
        };
      }
      if (!res.ok) {
        const msg = apiMutationMessage(
          res.status,
          json,
          '일정 수정에 실패했습니다.',
        );
        return { success: false, error: msg, errorCode: String(json.error ?? 'API_ERROR') };
      }
      await revalidateScheduleDataCaches();
      auditLog(session, {
        action: 'update',
        entity: 'schedule',
        entityId: id,
        summary: `일정 수정: ${validated.title.trim()}`,
        changes,
      });
      return { success: true, data: null };
    }

    const newStreamerIds = validated.participants.map((p) => p.id);
    const scheduleScalars = {
      title: validated.title.trim(),
      startTime: validated.startTime,
      liveUrls: validated.liveUrls?.map((u) => u.trim()).filter(Boolean) ?? [],
      isGuerrilla: validated.isGuerrilla ?? false,
      isNaeJeon: validated.isNaeJeon ?? false,
      isLiveEnded: validated.isLiveEnded ?? false,
    };

    await getPrismaForDomain().$transaction(async (tx) => {
      if (validated.expectedUpdatedAt) {
        const bump = await tx.schedule.updateMany({
          where: { id, updatedAt: validated.expectedUpdatedAt },
          data: {
            ...scheduleScalars,
            gameId: validated.gameId?.trim() || null,
          },
        });
        if (bump.count === 0) {
          const exists = await tx.schedule.findUnique({
            where: { id },
            select: { id: true },
          });
          if (!exists) {
            throw new ValidationError('일정을 찾을 수 없습니다.');
          }
          throw new ScheduleConflictError(SCHEDULE_CONFLICT_MESSAGE);
        }
      } else {
        await tx.schedule.update({
          where: { id },
          data: {
            ...scheduleScalars,
            game: validated.gameId
              ? { connect: { id: validated.gameId } }
              : { disconnect: true },
          },
        });
      }

      await tx.scheduleParticipant.deleteMany({
        where: { scheduleId: id, streamerId: { notIn: newStreamerIds } },
      });

      for (const { id: streamerId, nation, result, isGuest } of validated.participants) {
        await tx.scheduleParticipant.upsert({
          where: { scheduleId_streamerId: { scheduleId: id, streamerId } },
          create: {
            scheduleId: id,
            streamerId,
            nation: nation?.trim() || null,
            result: result?.trim() || null,
            isGuest: isGuest ?? false,
          },
          update: {
            nation: nation?.trim() || null,
            result: result?.trim() || null,
            isGuest: isGuest ?? false,
          },
        });
      }
    });

    await revalidateScheduleDataCaches();

    auditLog(session, {
      action: 'update',
      entity: 'schedule',
      entityId: id,
      summary: `일정 수정: ${validated.title.trim()}`,
      changes,
    });
    return { success: true, data: null };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('updateSchedule', error);
    return { success: false, error: message, errorCode: code };
  }
}

/**
 * 스트리머 생성
 */
export async function createStreamerAction(data: {
  name: string;
  handle: string;
  generation: number;
  role: string;
  platform: string;
  profileImg?: string;
  colorCode: string;
  chzzkUrl: string;
  youtubeUrl?: string;
  bio?: string;
  isGuest?: boolean;
}): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const validated = streamerServerSchema.parse(data);
    const changes = snapshotStreamer(validated);
    const payload = {
      name: validated.name,
      handle: validated.handle,
      generation: validated.generation,
      role: validated.role,
      platform: validated.platform,
      profileImg: validated.profileImg,
      colorCode: validated.colorCode,
      chzzkUrl: validated.chzzkUrl,
      youtubeUrl: validated.youtubeUrl,
      bio: validated.bio,
      isGuest: validated.isGuest,
    };

    const base = getScheduleServerBaseUrl();
    let createdStreamerId: string | undefined;
    if (base) {
      const r = await createStreamerOnServer(payload);
      if (!r.ok) {
        if (r.status === 409 || r.json.error === 'DUPLICATE_ENTRY') {
          return {
            success: false,
            error:
              typeof r.json.message === 'string'
                ? r.json.message
                : '이미 사용 중인 이름 또는 핸들입니다.',
            errorCode: 'DUPLICATE_ENTRY',
          };
        }
        return {
          success: false,
          error: apiMutationMessage(r.status, r.json, '스트리머 생성에 실패했습니다.'),
          errorCode: String(r.json.error ?? 'API_ERROR'),
        };
      }
      createdStreamerId = r.id;
    } else {
      const created = await getPrismaForDomain().streamer.create({
        data: {
          name: validated.name.trim(),
          handle: validated.handle.trim().toLowerCase(),
          generation: validated.generation,
          role: validated.role?.trim() || null,
          platform: validated.platform,
          profileImg: validated.profileImg?.trim() || null,
          colorCode: validated.colorCode,
          chzzkUrl: validated.chzzkUrl?.trim() || null,
          youtubeUrl: validated.youtubeUrl?.trim() || null,
          bio: validated.bio?.trim() || null,
          isGuest: validated.isGuest ?? false,
        },
      });
      createdStreamerId = created.id;
    }

    const youtubeCheck = await verifyStreamerYoutubeSaved(
      createdStreamerId,
      validated.youtubeUrl,
      Boolean(base),
    );
    if (youtubeCheck) return youtubeCheck;

    const paths = getRevalidationPathsMulti(['streamer', 'schedule', 'admin']);
    await Promise.all([
      ...paths.map((path: string) => revalidatePath(path)),
      updateTag('calendar'),
      updateTag('streamers'),
      updateTag('admin'),
    ]);

    auditLog(session, {
      action: 'create',
      entity: 'streamer',
      summary: `스트리머 생성: ${validated.name.trim()} (@${validated.handle.trim()})`,
      changes,
    });
    return { success: true, data: null };
  } catch (error) {
    const dup = streamerUniqueConstraintFailure(error);
    if (dup) return dup;
    const { message, code } = getErrorMessage(error);
    logError('createStreamer', error);
    return { success: false, error: message, errorCode: code };
  }
}

/**
 * 스트리머 수정
 */
export async function updateStreamerAction(
  id: string,
  data: {
    name: string;
    handle: string;
    generation: number;
    role: string;
    platform: string;
    profileImg?: string;
    colorCode: string;
    chzzkUrl: string;
    youtubeUrl?: string;
    bio?: string;
    isGuest?: boolean;
  },
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();

    if (!id?.trim()) {
      throw new ValidationError('유효한 스트리머 ID가 필요합니다.');
    }

    const validated = streamerServerSchema.parse(data);
    const before = await loadStreamerSnapshotBefore(id);
    const after = snapshotStreamer(validated);
    const changes = buildAuditDiff(before, after);
    const payload = {
      name: validated.name,
      handle: validated.handle,
      generation: validated.generation,
      role: validated.role,
      platform: validated.platform,
      profileImg: validated.profileImg,
      colorCode: validated.colorCode,
      chzzkUrl: validated.chzzkUrl,
      youtubeUrl: validated.youtubeUrl,
      bio: validated.bio,
      isGuest: validated.isGuest,
    };

    const base = getScheduleServerBaseUrl();
    if (base) {
      const r = await updateStreamerOnServer(id, payload);
      if (!r.ok) {
        if (r.status === 404) {
          return { success: false, error: '스트리머를 찾을 수 없습니다.', errorCode: 'NOT_FOUND' };
        }
        if (r.status === 409 || r.json.error === 'DUPLICATE_ENTRY') {
          return {
            success: false,
            error:
              typeof r.json.message === 'string'
                ? r.json.message
                : '이미 사용 중인 이름 또는 핸들입니다.',
            errorCode: 'DUPLICATE_ENTRY',
          };
        }
        return {
          success: false,
          error: apiMutationMessage(r.status, r.json, '스트리머 수정에 실패했습니다.'),
          errorCode: String(r.json.error ?? 'API_ERROR'),
        };
      }
    } else {
      await getPrismaForDomain().streamer.update({
        where: { id },
        data: {
          name: validated.name.trim(),
          handle: validated.handle.trim().toLowerCase(),
          generation: validated.generation,
          role: validated.role?.trim() || null,
          platform: validated.platform,
          profileImg: validated.profileImg?.trim() || null,
          colorCode: validated.colorCode,
          chzzkUrl: validated.chzzkUrl?.trim() || null,
          youtubeUrl: validated.youtubeUrl?.trim() || null,
          bio: validated.bio?.trim() || null,
          isGuest: validated.isGuest ?? false,
        },
      });
    }

    const youtubeCheck = await verifyStreamerYoutubeSaved(
      id,
      validated.youtubeUrl,
      Boolean(base),
    );
    if (youtubeCheck) return youtubeCheck;

    const paths = getRevalidationPathsMulti(['streamer', 'schedule', 'admin']);
    await Promise.all([
      ...paths.map((path: string) => revalidatePath(path)),
      revalidatePath(`/streamers/detail/${id}`),
      updateTag('calendar'),
      updateTag('streamers'),
      updateTag('admin'),
    ]);

    auditLog(session, {
      action: 'update',
      entity: 'streamer',
      entityId: id,
      summary: `스트리머 수정: ${validated.name.trim()} (@${validated.handle.trim()})`,
      changes,
    });
    return { success: true, data: null };
  } catch (error) {
    const dup = streamerUniqueConstraintFailure(error);
    if (dup) return dup;
    const { message, code } = getErrorMessage(error);
    logError('updateStreamer', error);
    return { success: false, error: message, errorCode: code };
  }
}

/**
 * 스트리머 일괄 생성
 */
export async function bulkCreateStreamersAction(
  streamersData: CreateStreamerInput[],
): Promise<ActionResult<{ created: number }>> {
  try {
    const session = await requireAdmin();

    if (!Array.isArray(streamersData) || streamersData.length === 0) {
      throw new ValidationError('생성할 스트리머 데이터가 필요합니다.');
    }

    const payloads = streamersData.map((s) =>
      streamerServerSchema.parse({
        name: s.name,
        handle: s.handle,
        generation: s.generation || 1,
        role: s.role,
        platform: s.platform || 'CHZZK',
        profileImg: s.profileImg,
        colorCode: s.colorCode || '#673AB7',
        chzzkUrl: s.chzzkUrl,
        youtubeUrl: s.youtubeUrl,
        isGuest: s.isGuest,
      }),
    );

    const base = getScheduleServerBaseUrl();
    let created: number;
    if (base) {
      const r = await bulkCreateStreamersOnServer(
        payloads.map((v) => ({
          name: v.name,
          handle: v.handle,
          generation: v.generation,
          role: v.role,
          platform: v.platform,
          profileImg: v.profileImg,
          colorCode: v.colorCode,
          chzzkUrl: v.chzzkUrl,
          youtubeUrl: v.youtubeUrl,
          isGuest: v.isGuest,
        })),
      );
      if (!r.ok) {
        return {
          success: false,
          error: apiMutationMessage(r.status, r.json, '스트리머 일괄 생성에 실패했습니다.'),
          errorCode: String(r.json.error ?? 'API_ERROR'),
        };
      }
      created = r.created;
    } else {
      const result = await getPrismaForDomain().streamer.createMany({
        data: payloads.map((v) => ({
          name: v.name.trim(),
          handle: v.handle.trim().toLowerCase(),
          generation: v.generation,
          role: v.role?.trim() || null,
          platform: v.platform,
          profileImg: v.profileImg?.trim() || null,
          colorCode: v.colorCode,
          chzzkUrl: v.chzzkUrl?.trim() || null,
          youtubeUrl: v.youtubeUrl?.trim() || null,
          isGuest: v.isGuest ?? false,
        })),
        skipDuplicates: true,
      });
      created = result.count;
    }

    const paths = getRevalidationPathsMulti(['streamer', 'schedule']);
    await Promise.all([
      ...paths.map((path: string) => revalidatePath(path)),
      updateTag('calendar'),
      updateTag('streamers'),
    ]);

    auditLog(session, {
      action: 'bulk_create',
      entity: 'streamer',
      summary: `스트리머 일괄 생성 ${created}명`,
      changes: {
        requested: streamersData.length,
        created,
        handles: payloads.map((p) => p.handle.trim().toLowerCase()),
      },
    });
    return { success: true, data: { created } };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('bulkCreateStreamers', error);
    return { success: false, error: message, errorCode: code };
  }
}

/**
 * 클립 생성
 */
export async function createClipAction(data: {
  title: string;
  url: string;
  streamerIds: string[];
  thumbnailUrl?: string;
  description?: string;
  clipDate?: Date;
  scheduleId?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();
    const validated = clipServerSchema.parse(data);
    const changes = snapshotClip(validated);
    const payload = {
      title: validated.title,
      url: validated.url,
      streamerIds: validated.streamerIds,
      thumbnailUrl: validated.thumbnailUrl,
      description: validated.description,
      clipDate: validated.clipDate ?? null,
      scheduleId: validated.scheduleId,
    };

    const base = getScheduleServerBaseUrl();
    let clipId: string;
    if (base) {
      const r = await createClipOnServer(payload);
      if (!r.ok) {
        return {
          success: false,
          error: apiMutationMessage(r.status, r.json, '클립 저장에 실패했습니다.'),
          errorCode: String(r.json.error ?? 'API_ERROR'),
        };
      }
      clipId = r.id;
    } else {
      const created = await getPrismaForDomain().clip.create({
        data: {
          title: validated.title.trim(),
          url: validated.url.trim(),
          thumbnailUrl: validated.thumbnailUrl?.trim() || null,
          description: validated.description?.trim() || null,
          clipDate: validated.clipDate ?? null,
          scheduleId: validated.scheduleId || null,
          participants: {
            create: validated.streamerIds.map((streamerId) => ({
              streamer: { connect: { id: streamerId } },
            })),
          },
        },
      });
      clipId = created.id;
    }

    const paths = getRevalidationPaths('clip');
    await Promise.all([
      ...paths.map((path: string) => revalidatePath(path)),
      updateTag('clips'),
    ]);

    auditLog(session, {
      action: 'create',
      entity: 'clip',
      entityId: clipId,
      summary: `클립 생성: ${validated.title.trim()}`,
      changes,
    });
    return { success: true, data: { id: clipId } };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('createClip', error);
    return { success: false, error: message, errorCode: code };
  }
}

/**
 * 클립 수정
 */
export async function updateClipAction(
  id: string,
  data: {
    title: string;
    url: string;
    streamerIds: string[];
    thumbnailUrl?: string;
    description?: string;
    clipDate?: Date;
    scheduleId?: string;
  },
): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    const validated = clipServerSchema.parse(data);
    const before = await loadClipSnapshotBefore(id);
    const after = snapshotClip(validated);
    const changes = buildAuditDiff(before, after);
    const payload = {
      title: validated.title,
      url: validated.url,
      streamerIds: validated.streamerIds,
      thumbnailUrl: validated.thumbnailUrl,
      description: validated.description,
      clipDate: validated.clipDate ?? null,
      scheduleId: validated.scheduleId,
    };

    const base = getScheduleServerBaseUrl();
    if (base) {
      const r = await updateClipOnServer(id, payload);
      if (!r.ok) {
        if (r.status === 404) {
          return { success: false, error: '클립을 찾을 수 없습니다.', errorCode: 'NOT_FOUND' };
        }
        return {
          success: false,
          error: apiMutationMessage(r.status, r.json, '클립 수정에 실패했습니다.'),
          errorCode: String(r.json.error ?? 'API_ERROR'),
        };
      }
    } else {
      await getPrismaForDomain().clip.update({
        where: { id },
        data: {
          title: validated.title.trim(),
          url: validated.url.trim(),
          thumbnailUrl: validated.thumbnailUrl?.trim() || null,
          description: validated.description?.trim() || null,
          clipDate: validated.clipDate ?? null,
          scheduleId: validated.scheduleId || null,
          participants: {
            deleteMany: {},
            create: validated.streamerIds.map((streamerId) => ({
              streamer: { connect: { id: streamerId } },
            })),
          },
        },
      });
    }

    const paths = getRevalidationPaths('clip');
    await Promise.all([
      ...paths.map((path: string) => revalidatePath(path)),
      updateTag('clips'),
    ]);

    auditLog(session, {
      action: 'update',
      entity: 'clip',
      entityId: id,
      summary: `클립 수정: ${validated.title.trim()}`,
      changes,
    });
    return { success: true, data: null };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('updateClip', error);
    return { success: false, error: message, errorCode: code };
  }
}

/**
 * 클립 삭제
 */
export async function deleteClipAction(id: string): Promise<ActionResult> {
  try {
    const session = await requireAuth();

    if (!id?.trim()) {
      throw new ValidationError('유효한 클립 ID가 필요합니다.');
    }

    const base = getScheduleServerBaseUrl();
    if (base) {
      const r = await deleteClipOnServer(id);
      if (!r.ok) {
        if (r.status === 404) {
          return { success: false, error: '클립을 찾을 수 없습니다.', errorCode: 'NOT_FOUND' };
        }
        return {
          success: false,
          error: apiMutationMessage(r.status, r.json, '클립 삭제에 실패했습니다.'),
          errorCode: String(r.json.error ?? 'API_ERROR'),
        };
      }
    } else {
      await getPrismaForDomain().clip.delete({ where: { id } });
    }

    const paths = getRevalidationPaths('clip');
    await Promise.all([
      ...paths.map((path: string) => revalidatePath(path)),
      updateTag('clips'),
    ]);

    auditLog(session, {
      action: 'delete',
      entity: 'clip',
      entityId: id,
      summary: `클립 삭제 id=${id}`,
    });
    return { success: true, data: null };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('deleteClip', error);
    return { success: false, error: message, errorCode: code };
  }
}

/**
 * 게임 생성 (로그인 유저). 이미 같은 제목이 있으면 기존 id 반환.
 */
export async function createGameAction(data: {
  title: string;
  isHoi4?: boolean;
}): Promise<ActionResult<{ id: string; title: string }>> {
  try {
    const session = await requireAuth();
    const title = data.title?.trim();
    if (!title) throw new ValidationError('게임 제목이 필요합니다.');
    if (title.length > 80) throw new ValidationError('게임 제목은 80자 이내로 입력해 주세요.');
    const isHoi4 = data.isHoi4 ?? false;
    const changes = snapshotGame({ title, isHoi4 });

    const base = getScheduleServerBaseUrl();
    if (base) {
      const existingList = await fetchAllGamesFromServer().catch(() => []);
      const existing = existingList.find(
        (g) => g.title.trim().toLowerCase() === title.toLowerCase(),
      );
      if (existing) {
        return { success: true, data: { id: existing.id, title: existing.title } };
      }

      const res = await fetchWithBackoff(`${base}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, isHoi4 }),
      });
      const json = (await res.json()) as {
        id?: string;
        title?: string;
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        return {
          success: false,
          error: json.message ?? '게임 생성에 실패했습니다.',
          errorCode: json.error ?? 'API_ERROR',
        };
      }
      let id = json.id;
      if (!id) {
        const refreshed = await fetchAllGamesFromServer().catch(() => []);
        id = refreshed.find((g) => g.title.trim().toLowerCase() === title.toLowerCase())?.id;
      }
      if (!id) {
        return {
          success: false,
          error: '게임이 만들어졌지만 ID를 확인하지 못했습니다.',
          errorCode: 'API_ERROR',
        };
      }
      const paths = getRevalidationPaths('game');
      await Promise.all([
        ...paths.map((path: string) => revalidatePath(path)),
        updateTag('calendar'),
      ]);
      auditLog(session, {
        action: 'create',
        entity: 'game',
        entityId: id,
        summary: `게임 생성: ${title}`,
        changes,
      });
      return { success: true, data: { id, title: json.title?.trim() || title } };
    }

    const prisma = getPrismaForDomain();
    const existing = await prisma.game.findFirst({
      where: { title: { equals: title, mode: 'insensitive' } },
      select: { id: true, title: true },
    });
    if (existing) {
      return { success: true, data: existing };
    }

    const created = await prisma.game.create({
      data: { title, isHoi4 },
      select: { id: true, title: true },
    });

    const paths = getRevalidationPaths('game');
    await Promise.all([
      ...paths.map((path: string) => revalidatePath(path)),
      updateTag('calendar'),
    ]);

    auditLog(session, {
      action: 'create',
      entity: 'game',
      entityId: created.id,
      summary: `게임 생성: ${title}`,
      changes,
    });
    return { success: true, data: created };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('createGame', error);
    return { success: false, error: message, errorCode: code };
  }
}

/**
 * 게임 수정
 */
export async function updateGameAction(
  id: string,
  data: { title: string; isHoi4?: boolean },
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    if (!id?.trim()) throw new ValidationError('유효한 게임 ID가 필요합니다.');
    if (!data.title?.trim()) throw new ValidationError('게임 제목이 필요합니다.');
    const before = await loadGameSnapshotBefore(id);
    const after = snapshotGame(data);
    const changes = buildAuditDiff(before, after);

    const base = getScheduleServerBaseUrl();
    if (base) {
      const res = await fetchWithBackoff(`${base}/games/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title.trim(),
          isHoi4: data.isHoi4 ?? false,
        }),
      });
      const json = (await res.json()) as { error?: string; message?: string };
      if (res.status === 404) {
        return { success: false, error: '게임을 찾을 수 없습니다.', errorCode: 'NOT_FOUND' };
      }
      if (!res.ok) {
        return {
          success: false,
          error: json.message ?? '게임 수정에 실패했습니다.',
          errorCode: json.error ?? 'API_ERROR',
        };
      }
      const paths = getRevalidationPaths('game');
      await Promise.all([
        ...paths.map((path: string) => revalidatePath(path)),
        updateTag('calendar'),
      ]);
      auditLog(session, {
        action: 'update',
        entity: 'game',
        entityId: id,
        summary: `게임 수정: ${data.title.trim()}`,
        changes,
      });
      return { success: true, data: null };
    }

    await getPrismaForDomain().game.update({
      where: { id },
      data: { title: data.title.trim(), isHoi4: data.isHoi4 ?? false },
    });

    const paths = getRevalidationPaths('game');
    await Promise.all([
      ...paths.map((path: string) => revalidatePath(path)),
      updateTag('calendar'),
    ]);

    auditLog(session, {
      action: 'update',
      entity: 'game',
      entityId: id,
      summary: `게임 수정: ${data.title.trim()}`,
      changes,
    });
    return { success: true, data: null };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('updateGame', error);
    return { success: false, error: message, errorCode: code };
  }
}

/**
 * 게임 삭제
 */
export async function deleteGameAction(id: string): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    if (!id?.trim()) throw new ValidationError('유효한 게임 ID가 필요합니다.');

    const base = getScheduleServerBaseUrl();
    if (base) {
      const res = await fetchWithBackoff(`${base}/games/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const json = (await res.json()) as { error?: string; message?: string };
      if (res.status === 404) {
        return { success: false, error: '게임을 찾을 수 없습니다.', errorCode: 'NOT_FOUND' };
      }
      if (!res.ok) {
        return {
          success: false,
          error: json.message ?? '게임 삭제에 실패했습니다.',
          errorCode: json.error ?? 'API_ERROR',
        };
      }
      const paths = getRevalidationPaths('game');
      await Promise.all([
        ...paths.map((path: string) => revalidatePath(path)),
        updateTag('calendar'),
      ]);
      auditLog(session, {
        action: 'delete',
        entity: 'game',
        entityId: id,
        summary: `게임 삭제 id=${id}`,
      });
      return { success: true, data: null };
    }

    await getPrismaForDomain().game.delete({ where: { id } });

    const paths = getRevalidationPaths('game');
    await Promise.all([
      ...paths.map((path: string) => revalidatePath(path)),
      updateTag('calendar'),
    ]);

    auditLog(session, {
      action: 'delete',
      entity: 'game',
      entityId: id,
      summary: `게임 삭제 id=${id}`,
    });
    return { success: true, data: null };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('deleteGame', error);
    return { success: false, error: message, errorCode: code };
  }
}

/**
 * 피드백 생성 (정보 수정 요청 / 에러 제보 등)
 */
export async function createFeedbackAction(formData: {
  streamerId?: string;
  streamerName?: string;
  category: string;
  content: string;
  /** 에러 제보·사이트 문제는 `ERROR_REPORT`로 어드민 피드백 목록에서 구분 */
  type?: 'EDIT_REQUEST' | 'ERROR_REPORT';
}): Promise<ActionResult> {
  try {
    const validated = feedbackSchema.parse(formData);
    const contentTrimmed = validated.content.trim();
    const contentOut =
      contentTrimmed.length > 5000 ? contentTrimmed.slice(0, 5000) : contentTrimmed;

    const inserted = await submitFeedbackCore({
      category: validated.category.trim(),
      content: contentOut,
      streamerId: formData.streamerId,
      streamerName: formData.streamerName,
      type: formData.type,
    });

    if (!inserted.ok) {
      return {
        success: false,
        error: inserted.error,
        errorCode: inserted.errorCode,
      };
    }

    try {
      const paths = getRevalidationPaths('admin');
      await Promise.all([
        ...paths.map((path: string) => revalidatePath(path)),
        updateTag('admin'),
      ]);
    } catch (e) {
      logError('createFeedbackRevalidate', e);
    }

    auditLog(null, {
      action: 'create',
      entity: 'feedback',
      summary: `피드백 접수: ${validated.category.trim()}`,
      changes: snapshotFeedback({
        category: validated.category.trim(),
        type: formData.type,
        streamerId: formData.streamerId,
        streamerName: formData.streamerName,
        contentLength: contentOut.length,
      }),
    });
    return { success: true, data: null };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('createFeedback', error);
    return { success: false, error: message, errorCode: code };
  }
}

export async function rejectFeedbackAction(
  feedbackId: string,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const base = getScheduleServerBaseUrl();
    if (base) {
      const res = await fetchWithBackoff(`${base}/feedbacks/${encodeURIComponent(feedbackId)}/reject`, {
        method: 'PATCH',
      });
      const json = (await res.json()) as { error?: string; message?: string };
      if (res.status === 404) {
        return { success: false, error: '피드백을 찾을 수 없습니다.', errorCode: 'NOT_FOUND' };
      }
      if (!res.ok) {
        return {
          success: false,
          error: json.message ?? '피드백 반려에 실패했습니다.',
          errorCode: json.error ?? 'API_ERROR',
        };
      }
      const paths = getRevalidationPaths('admin');
      await Promise.all([
        ...paths.map((path: string) => revalidatePath(path)),
        updateTag('admin'),
      ]);
      auditLog(session, {
        action: 'reject',
        entity: 'feedback',
        entityId: feedbackId,
        summary: `피드백 반려 id=${feedbackId}`,
        changes: { status: 'REJECTED' },
      });
      return { success: true, data: null };
    }
    await getPrismaForDomain().feedback.update({
      where: { id: feedbackId },
      data: { status: 'REJECTED' },
    });

    const paths = getRevalidationPaths('admin');
    await Promise.all([
      ...paths.map((path: string) => revalidatePath(path)),
      updateTag('admin'),
    ]);

    auditLog(session, {
      action: 'reject',
      entity: 'feedback',
      entityId: feedbackId,
      summary: `피드백 반려 id=${feedbackId}`,
      changes: { status: 'REJECTED' },
    });
    return { success: true, data: null };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('rejectFeedback', error);
    return { success: false, error: message, errorCode: code };
  }
}

/* ── 긴급 공지 (SiteNotice) ───────────────────────────────── */

type NoticeLevelInput = 'INFO' | 'WARNING' | 'URGENT';

export type SiteNoticeInput = {
  level: NoticeLevelInput;
  title: string;
  body?: string | null;
  active?: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
};

function normalizeNoticeInput(data: SiteNoticeInput) {
  const level: NoticeLevelInput = ['INFO', 'WARNING', 'URGENT'].includes(data.level)
    ? data.level
    : 'INFO';
  const title = data.title?.trim();
  if (!title) throw new ValidationError('공지 제목이 필요합니다.');
  if (title.length > 120) throw new ValidationError('제목은 120자 이내여야 합니다.');
  const body = data.body?.trim() || null;
  if (body && body.length > 2000) throw new ValidationError('본문은 2000자 이내여야 합니다.');
  const startsAt = data.startsAt ?? null;
  const endsAt = data.endsAt ?? null;
  if (startsAt && endsAt && endsAt.getTime() <= startsAt.getTime()) {
    throw new ValidationError('만료 시각은 게시 시작 시각보다 뒤여야 합니다.');
  }
  return { level, title, body, active: data.active ?? true, startsAt, endsAt };
}

async function revalidateSiteNotice() {
  const paths = getRevalidationPaths('admin');
  await Promise.all([
    ...paths.map((path: string) => revalidatePath(path)),
    revalidatePath('/admin/notices'),
    updateTag('site-notice'),
  ]);
}

export async function createSiteNoticeAction(
  data: SiteNoticeInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAdmin();
    const v = normalizeNoticeInput(data);
    const created = await getPrisma().siteNotice.create({ data: v });
    await revalidateSiteNotice();
    auditLog(session, {
      action: 'create',
      entity: 'siteNotice',
      entityId: created.id,
      summary: `긴급 공지 생성: [${v.level}] ${v.title}`,
      changes: v,
    });
    return { success: true, data: { id: created.id } };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('createSiteNotice', error);
    return { success: false, error: message, errorCode: code };
  }
}

export async function updateSiteNoticeAction(
  id: string,
  data: SiteNoticeInput,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    if (!id?.trim()) throw new ValidationError('유효한 공지 ID가 필요합니다.');
    const v = normalizeNoticeInput(data);
    await getPrisma().siteNotice.update({ where: { id }, data: v });
    await revalidateSiteNotice();
    auditLog(session, {
      action: 'update',
      entity: 'siteNotice',
      entityId: id,
      summary: `긴급 공지 수정: [${v.level}] ${v.title}`,
      changes: v,
    });
    return { success: true, data: null };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('updateSiteNotice', error);
    return { success: false, error: message, errorCode: code };
  }
}

export async function toggleSiteNoticeAction(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    if (!id?.trim()) throw new ValidationError('유효한 공지 ID가 필요합니다.');
    await getPrisma().siteNotice.update({ where: { id }, data: { active } });
    await revalidateSiteNotice();
    auditLog(session, {
      action: 'update',
      entity: 'siteNotice',
      entityId: id,
      summary: `긴급 공지 ${active ? '게시' : '내림'} id=${id}`,
      changes: { active },
    });
    return { success: true, data: null };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('toggleSiteNotice', error);
    return { success: false, error: message, errorCode: code };
  }
}

export async function deleteSiteNoticeAction(id: string): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    if (!id?.trim()) throw new ValidationError('유효한 공지 ID가 필요합니다.');
    await getPrisma().siteNotice.delete({ where: { id } });
    await revalidateSiteNotice();
    auditLog(session, {
      action: 'delete',
      entity: 'siteNotice',
      entityId: id,
      summary: `긴급 공지 삭제 id=${id}`,
    });
    return { success: true, data: null };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('deleteSiteNotice', error);
    return { success: false, error: message, errorCode: code };
  }
}

export async function resolveFeedbackAction(
  feedbackId: string,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const base = getScheduleServerBaseUrl();
    if (base) {
      const res = await fetchWithBackoff(`${base}/feedbacks/${encodeURIComponent(feedbackId)}/resolve`, {
        method: 'PATCH',
      });
      const json = (await res.json()) as { error?: string; message?: string };
      if (res.status === 404) {
        return { success: false, error: '피드백을 찾을 수 없습니다.', errorCode: 'NOT_FOUND' };
      }
      if (!res.ok) {
        return {
          success: false,
          error: json.message ?? '피드백 처리에 실패했습니다.',
          errorCode: json.error ?? 'API_ERROR',
        };
      }
      const paths = getRevalidationPaths('admin');
      await Promise.all([
        ...paths.map((path: string) => revalidatePath(path)),
        updateTag('admin'),
      ]);
      auditLog(session, {
        action: 'resolve',
        entity: 'feedback',
        entityId: feedbackId,
        summary: `피드백 처리 완료 id=${feedbackId}`,
        changes: { status: 'RESOLVED' },
      });
      return { success: true, data: null };
    }
    await getPrismaForDomain().feedback.update({
      where: { id: feedbackId },
      data: { status: 'RESOLVED' },
    });

    const paths = getRevalidationPaths('admin');
    await Promise.all([
      ...paths.map((path: string) => revalidatePath(path)),
      updateTag('admin'),
    ]);

    auditLog(session, {
      action: 'resolve',
      entity: 'feedback',
      entityId: feedbackId,
      summary: `피드백 처리 완료 id=${feedbackId}`,
      changes: { status: 'RESOLVED' },
    });
    return { success: true, data: null };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('resolveFeedback', error);
    return { success: false, error: message, errorCode: code };
  }
}
