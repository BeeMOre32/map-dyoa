// src/app/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
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
import { runDeleteSchedule } from '@/lib/schedule-delete-server';
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
  participants: { id: string; nation?: string; result?: string }[];
  gameId?: string;
  liveUrls?: string[];
  isGuerrilla?: boolean;
  isNaeJeon?: boolean;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAuth();
    const validated = scheduleServerSchema.parse(data);

    const created = await prisma.schedule.create({
      data: {
        title: validated.title.trim(),
        startTime: validated.startTime,
        participants: {
          create: validated.participants.map(({ id, nation, result }) => ({
            streamer: { connect: { id } },
            nation: nation?.trim() || null,
            result: result || null,
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
    participants: { id: string; nation?: string; result?: string }[];
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
    const newStreamerIds = validated.participants.map((p) => p.id);

    await prisma.$transaction([
      prisma.schedule.update({
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
      prisma.scheduleParticipant.deleteMany({
        where: { scheduleId: id, streamerId: { notIn: newStreamerIds } },
      }),
      ...validated.participants.map(({ id: streamerId, nation, result }) =>
        prisma.scheduleParticipant.upsert({
          where: { scheduleId_streamerId: { scheduleId: id, streamerId } },
          create: { scheduleId: id, streamerId, nation: nation?.trim() || null, result: result || null },
          update: { nation: nation?.trim() || null, result: result || null },
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
  colorCode: string;
  chzzkUrl: string;
  bio?: string;
}): Promise<ActionResult> {
  try {
    await requireAdmin();

    const validated = streamerServerSchema.parse(data);

    await prisma.streamer.create({
      data: {
        name: validated.name.trim(),
        handle: validated.handle.trim().toLowerCase(),
        generation: validated.generation,
        role: validated.role?.trim() || null,
        platform: validated.platform,
        colorCode: validated.colorCode,
        chzzkUrl: validated.chzzkUrl?.trim() || null,
        bio: validated.bio?.trim() || null,
      },
    });

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
    colorCode: string;
    chzzkUrl: string;
    bio?: string;
  },
): Promise<ActionResult> {
  try {
    await requireAdmin();

    if (!id?.trim()) {
      throw new ValidationError('유효한 스트리머 ID가 필요합니다.');
    }

    const validated = streamerServerSchema.parse(data);

    await prisma.streamer.update({
      where: { id },
      data: {
        name: validated.name.trim(),
        handle: validated.handle.trim().toLowerCase(),
        generation: validated.generation,
        role: validated.role?.trim() || null,
        platform: validated.platform,
        colorCode: validated.colorCode,
        chzzkUrl: validated.chzzkUrl?.trim() || null,
        bio: validated.bio?.trim() || null,
      },
    });

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

    const result = await prisma.streamer.createMany({
      data: streamersData.map((s) => ({
        name: s.name?.trim(),
        handle: s.handle?.trim(),
        generation: s.generation || 1,
        role: s.role?.trim() || null,
        platform: s.platform || 'CHZZK',
        colorCode: s.colorCode || '#673AB7',
        chzzkUrl: s.chzzkUrl?.trim() || null,
      })),
      skipDuplicates: true,
    });

    const paths = getRevalidationPathsMulti(['streamer', 'schedule']);
    await Promise.all([
      ...paths.map((path: string) => revalidatePath(path)),
      updateTag('calendar'),
      updateTag('streamers'),
    ]);

    return { success: true, data: { created: result.count } };
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

    const created = await prisma.clip.create({
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

    const paths = getRevalidationPaths('clip');
    await Promise.all([
      ...paths.map((path: string) => revalidatePath(path)),
      updateTag('clips'),
    ]);

    return { success: true, data: { id: created.id } };
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

    await prisma.clip.update({
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

    await prisma.clip.delete({ where: { id } });

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

    await prisma.game.create({
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

    await prisma.game.update({
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

    await prisma.game.delete({ where: { id } });

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
 * 피드백 생성
 */
export async function createFeedbackAction(formData: {
  streamerId: string;
  streamerName: string;
  category: string;
  content: string;
}): Promise<ActionResult> {
  try {
    const validated = feedbackSchema.parse(formData);

    await prisma.feedback.create({
      data: {
        type: 'EDIT_REQUEST',
        category: validated.category.trim(),
        content: validated.content.trim(),
        streamerId: formData.streamerId || null,
        streamerName: formData.streamerName || null,
      },
    });

    const paths = getRevalidationPaths('admin');
    await Promise.all([
      ...paths.map((path: string) => revalidatePath(path)),
      updateTag('admin'),
    ]);

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
    await prisma.feedback.update({
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
    await prisma.feedback.update({
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
