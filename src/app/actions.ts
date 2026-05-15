// src/app/actions.ts
'use server';

import { getPrismaForDomain } from '@/lib/prisma';
import { revalidatePath, updateTag } from 'next/cache';
import { requireAdmin, requireAuth } from '@/lib/auth-helpers';
import { ActionResult } from '@/types/api-response';
import {
  ValidationError,
  getErrorMessage,
  logError,
} from '@/lib/error-handling';
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
import { apiMutationMessage } from '@/lib/map-dyoa-server-fetch';
import { getScheduleServerBaseUrl } from '@/lib/map-dyoa-server-schedules';
import {
  bulkCreateStreamersOnServer,
  createStreamerOnServer,
  updateStreamerOnServer,
} from '@/lib/map-dyoa-server-streamers';
import { runDeleteSchedule } from '@/lib/schedule-delete-server';
import { submitFeedbackCore } from '@/lib/feedback-submit';
import {
  scheduleServerSchema,
  clipServerSchema,
  feedbackSchema,
  streamerServerSchema,
} from '@/lib/schemas';
import type { CreateStreamerInput } from '@/types/models';

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
    await requireAuth();
    const validated = scheduleServerSchema.parse(data);

    const base = getScheduleServerBaseUrl();
    if (base) {
      const res = await fetchWithBackoff(`${base}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: validated.title.trim(),
          startTime: validated.startTime.toISOString(),
          participants: validated.participants.map(({ id, nation, result, isGuest }) => ({
            id,
            nation,
            result,
            isGuest,
          })),
          gameId: validated.gameId?.trim() || undefined,
          liveUrls: validated.liveUrls?.map((u) => u.trim()).filter(Boolean) ?? [],
          isGuerrilla: validated.isGuerrilla ?? false,
          isNaeJeon: validated.isNaeJeon ?? false,
        }),
      });
      const json = (await res.json()) as { id?: string; error?: string; message?: string; issues?: unknown };
      if (!res.ok) {
        const msg =
          res.status === 400 && json.error === 'VALIDATION'
            ? '입력 값을 확인해주세요.'
            : typeof json.message === 'string'
              ? json.message
              : '일정 저장에 실패했습니다.';
        return { success: false, error: msg, errorCode: json.error ?? 'API_ERROR' };
      }
      if (!json.id) {
        return { success: false, error: '응답에 일정 ID가 없습니다.', errorCode: 'API_ERROR' };
      }
      const paths = getRevalidationPaths('schedule');
      await Promise.all([
        ...paths.map((path: string) => revalidatePath(path)),
        updateTag('calendar'),
      ]);
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
            result: result || null,
            isGuest: isGuest ?? false,
          })),
        },
        ...(validated.gameId ? { game: { connect: { id: validated.gameId } } } : {}),
        liveUrls: validated.liveUrls?.map((u) => u.trim()).filter(Boolean) ?? [],
        isGuerrilla: validated.isGuerrilla ?? false,
        isNaeJeon: validated.isNaeJeon ?? false,
      },
    });

    const paths = getRevalidationPaths('schedule');
    await Promise.all([
      ...paths.map((path: string) => revalidatePath(path)),
      updateTag('calendar'),
    ]);

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
    await requireAuth();
    await runDeleteSchedule(id);
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
  },
): Promise<ActionResult> {
  try {
    await requireAuth();
    const validated = scheduleServerSchema.parse(data);

    const base = getScheduleServerBaseUrl();
    if (base) {
      const res = await fetchWithBackoff(`${base}/schedules/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: validated.title.trim(),
          startTime: validated.startTime.toISOString(),
          participants: validated.participants.map(({ id: sid, nation, result, isGuest }) => ({
            id: sid,
            nation,
            result,
            isGuest,
          })),
          gameId: validated.gameId?.trim() || undefined,
          liveUrls: validated.liveUrls?.map((u) => u.trim()).filter(Boolean) ?? [],
          isGuerrilla: validated.isGuerrilla ?? false,
          isNaeJeon: validated.isNaeJeon ?? false,
          isLiveEnded: validated.isLiveEnded ?? false,
        }),
      });
      const json = (await res.json()) as { error?: string; message?: string };
      if (res.status === 404) {
        return { success: false, error: '일정을 찾을 수 없습니다.', errorCode: 'NOT_FOUND' };
      }
      if (!res.ok) {
        const msg =
          res.status === 400 && json.error === 'VALIDATION'
            ? '입력 값을 확인해주세요.'
            : typeof json.message === 'string'
              ? json.message
              : '일정 수정에 실패했습니다.';
        return { success: false, error: msg, errorCode: json.error ?? 'API_ERROR' };
      }
      const paths = getRevalidationPaths('schedule');
      await Promise.all([
        ...paths.map((path: string) => revalidatePath(path)),
        updateTag('calendar'),
      ]);
      return { success: true, data: null };
    }

    const newStreamerIds = validated.participants.map((p) => p.id);

    await getPrismaForDomain().$transaction([
      getPrismaForDomain().schedule.update({
        where: { id },
        data: {
          title: validated.title.trim(),
          startTime: validated.startTime,
          game: validated.gameId ? { connect: { id: validated.gameId } } : { disconnect: true },
          liveUrls: validated.liveUrls?.map((u) => u.trim()).filter(Boolean) ?? [],
          isGuerrilla: validated.isGuerrilla ?? false,
          isNaeJeon: validated.isNaeJeon ?? false,
          isLiveEnded: validated.isLiveEnded ?? false,
        },
      }),
      getPrismaForDomain().scheduleParticipant.deleteMany({
        where: { scheduleId: id, streamerId: { notIn: newStreamerIds } },
      }),
      ...validated.participants.map(({ id: streamerId, nation, result, isGuest }) =>
        getPrismaForDomain().scheduleParticipant.upsert({
          where: { scheduleId_streamerId: { scheduleId: id, streamerId } },
          create: {
            scheduleId: id,
            streamerId,
            nation: nation?.trim() || null,
            result: result || null,
            isGuest: isGuest ?? false,
          },
          update: {
            nation: nation?.trim() || null,
            result: result || null,
            isGuest: isGuest ?? false,
          },
        }),
      ),
    ]);

    const paths = getRevalidationPaths('schedule');
    await Promise.all([
      ...paths.map((path: string) => revalidatePath(path)),
      updateTag('calendar'),
    ]);

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
  bio?: string;
  isGuest?: boolean;
}): Promise<ActionResult> {
  try {
    await requireAdmin();

    const validated = streamerServerSchema.parse(data);
    const payload = {
      name: validated.name,
      handle: validated.handle,
      generation: validated.generation,
      role: validated.role,
      platform: validated.platform,
      profileImg: validated.profileImg,
      colorCode: validated.colorCode,
      chzzkUrl: validated.chzzkUrl,
      bio: validated.bio,
      isGuest: validated.isGuest,
    };

    const base = getScheduleServerBaseUrl();
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
    } else {
      await getPrismaForDomain().streamer.create({
        data: {
          name: validated.name.trim(),
          handle: validated.handle.trim().toLowerCase(),
          generation: validated.generation,
          role: validated.role?.trim() || null,
          platform: validated.platform,
          profileImg: validated.profileImg?.trim() || null,
          colorCode: validated.colorCode,
          chzzkUrl: validated.chzzkUrl?.trim() || null,
          bio: validated.bio?.trim() || null,
          isGuest: validated.isGuest ?? false,
        },
      });
    }

    const paths = getRevalidationPathsMulti(['streamer', 'schedule', 'admin']);
    await Promise.all([
      ...paths.map((path: string) => revalidatePath(path)),
      updateTag('calendar'),
      updateTag('streamers'),
      updateTag('admin'),
    ]);

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
    bio?: string;
    isGuest?: boolean;
  },
): Promise<ActionResult> {
  try {
    await requireAdmin();

    if (!id?.trim()) {
      throw new ValidationError('유효한 스트리머 ID가 필요합니다.');
    }

    const validated = streamerServerSchema.parse(data);
    const payload = {
      name: validated.name,
      handle: validated.handle,
      generation: validated.generation,
      role: validated.role,
      platform: validated.platform,
      profileImg: validated.profileImg,
      colorCode: validated.colorCode,
      chzzkUrl: validated.chzzkUrl,
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
          bio: validated.bio?.trim() || null,
          isGuest: validated.isGuest ?? false,
        },
      });
    }

    const paths = getRevalidationPathsMulti(['streamer', 'schedule', 'admin']);
    await Promise.all([
      ...paths.map((path: string) => revalidatePath(path)),
      updateTag('calendar'),
      updateTag('streamers'),
      updateTag('admin'),
    ]);

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
    await requireAdmin();

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
    await requireAuth();
    const validated = clipServerSchema.parse(data);
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
    await requireAuth();
    const validated = clipServerSchema.parse(data);
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
    await requireAuth();

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

    return { success: true, data: null };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('deleteClip', error);
    return { success: false, error: message, errorCode: code };
  }
}

/**
 * 게임 생성
 */
export async function createGameAction(data: {
  title: string;
  isHoi4?: boolean;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!data.title?.trim()) throw new ValidationError('게임 제목이 필요합니다.');

    const base = getScheduleServerBaseUrl();
    if (base) {
      const res = await fetchWithBackoff(`${base}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title.trim(),
          isHoi4: data.isHoi4 ?? false,
        }),
      });
      const json = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        return {
          success: false,
          error: json.message ?? '게임 생성에 실패했습니다.',
          errorCode: json.error ?? 'API_ERROR',
        };
      }
      const paths = getRevalidationPaths('game');
      await Promise.all([
        ...paths.map((path: string) => revalidatePath(path)),
        updateTag('calendar'),
      ]);
      return { success: true, data: null };
    }

    await getPrismaForDomain().game.create({
      data: { title: data.title.trim(), isHoi4: data.isHoi4 ?? false },
    });

    const paths = getRevalidationPaths('game');
    await Promise.all([
      ...paths.map((path: string) => revalidatePath(path)),
      updateTag('calendar'),
    ]);

    return { success: true, data: null };
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
    await requireAdmin();
    if (!id?.trim()) throw new ValidationError('유효한 게임 ID가 필요합니다.');
    if (!data.title?.trim()) throw new ValidationError('게임 제목이 필요합니다.');

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
    await requireAdmin();
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
      return { success: true, data: null };
    }

    await getPrismaForDomain().game.delete({ where: { id } });

    const paths = getRevalidationPaths('game');
    await Promise.all([
      ...paths.map((path: string) => revalidatePath(path)),
      updateTag('calendar'),
    ]);

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
    await requireAdmin();
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

    return { success: true, data: null };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('rejectFeedback', error);
    return { success: false, error: message, errorCode: code };
  }
}

export async function resolveFeedbackAction(
  feedbackId: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
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

    return { success: true, data: null };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('resolveFeedback', error);
    return { success: false, error: message, errorCode: code };
  }
}
