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
import {
  getRevalidationPaths,
  getRevalidationPathsMulti,
} from '@/constants/revalidation-paths';

/**
 * 일정 생성
 */
export async function createScheduleAction(data: {
  title: string;
  startTime: Date;
  streamerIds: string[];
  gameId?: string;
  liveUrl?: string;
  isGuerrilla?: boolean;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAuth();

    // 입력 검증
    if (!data.title?.trim()) {
      throw new ValidationError('제목을 입력해주세요.');
    }
    if (!data.startTime || isNaN(new Date(data.startTime).getTime())) {
      throw new ValidationError('올바른 시간을 입력해주세요.');
    }
    if (!data.streamerIds || data.streamerIds.length === 0) {
      throw new ValidationError('참여자를 최소 1명 이상 선택해주세요.');
    }

    const created = await prisma.schedule.create({
      data: {
        title: data.title.trim(),
        startTime: new Date(data.startTime),
        participants: {
          create: data.streamerIds.map((id) => ({
            streamer: { connect: { id } },
          })),
        },
        ...(data.gameId ? { game: { connect: { id: data.gameId } } } : {}),
        liveUrl: data.liveUrl?.trim() || null,
        isGuerrilla: data.isGuerrilla ?? false,
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

    if (!id?.trim()) {
      throw new ValidationError('유효한 일정 ID가 필요합니다.');
    }

    await prisma.schedule.delete({ where: { id } });

    const paths = getRevalidationPaths('schedule');
    await Promise.all([
      ...paths.map((path: string) => revalidatePath(path)),
      updateTag('calendar'),
    ]);

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
    streamerIds: string[];
    gameId?: string;
    liveUrl?: string;
    isGuerrilla?: boolean;
    isLiveEnded?: boolean;
  },
): Promise<ActionResult> {
  try {
    await requireAuth();

    if (!id?.trim()) {
      throw new ValidationError('유효한 일정 ID가 필요합니다.');
    }
    if (!data.title?.trim()) {
      throw new ValidationError('제목을 입력해주세요.');
    }
    if (!data.startTime || isNaN(new Date(data.startTime).getTime())) {
      throw new ValidationError('올바른 시간을 입력해주세요.');
    }
    if (!data.streamerIds || data.streamerIds.length === 0) {
      throw new ValidationError('참여자를 최소 1명 이상 선택해주세요.');
    }

    await prisma.schedule.update({
      where: { id },
      data: {
        title: data.title.trim(),
        startTime: new Date(data.startTime),
        game: data.gameId ? { connect: { id: data.gameId } } : { disconnect: true },
        liveUrl: data.liveUrl?.trim() || null,
        isGuerrilla: data.isGuerrilla ?? false,
        isLiveEnded: data.isLiveEnded ?? false,
        participants: {
          deleteMany: {},
          create: data.streamerIds.map((streamerId) => ({
            streamer: { connect: { id: streamerId } },
          })),
        },
      },
    });

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
}): Promise<ActionResult> {
  try {
    await requireAdmin();

    if (!data.name?.trim()) {
      throw new ValidationError('이름을 입력해주세요.');
    }
    if (!data.handle?.trim()) {
      throw new ValidationError('핸들을 입력해주세요.');
    }

    await prisma.streamer.create({
      data: {
        name: data.name.trim(),
        handle: data.handle.trim(),
        generation: data.generation || 1,
        role: data.role?.trim() || null,
        platform: data.platform || 'CHZZK',
        colorCode: data.colorCode || '#673AB7',
        chzzkUrl: data.chzzkUrl?.trim() || null,
      },
    });

    const paths = getRevalidationPathsMulti(['streamer', 'schedule']);
    await Promise.all([
      ...paths.map((path: string) => revalidatePath(path)),
      updateTag('calendar'),
      updateTag('streamers'),
    ]);

    return { success: true, data: null };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('createStreamer', error);
    return { success: false, error: message, errorCode: code };
  }
}

/**
 * 스트리머 일괄 생성
 */
export async function bulkCreateStreamersAction(
  streamersData: any[],
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

    if (!data.title?.trim()) {
      throw new ValidationError('제목을 입력해주세요.');
    }
    if (!data.url?.trim()) {
      throw new ValidationError('클립 URL을 입력해주세요.');
    }
    if (!data.streamerIds || data.streamerIds.length === 0) {
      throw new ValidationError('연관된 스트리머를 최소 1명 선택해주세요.');
    }

    const created = await prisma.clip.create({
      data: {
        title: data.title.trim(),
        url: data.url.trim(),
        thumbnailUrl: data.thumbnailUrl?.trim() || null,
        description: data.description?.trim() || null,
        clipDate: data.clipDate ? new Date(data.clipDate) : null,
        scheduleId: data.scheduleId || null,
        participants: {
          create: data.streamerIds.map((streamerId) => ({
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
 * 피드백 생성
 */
export async function createFeedbackAction(formData: {
  streamerId: string;
  streamerName: string;
  category: string;
  content: string;
}): Promise<ActionResult> {
  try {
    if (!formData.category?.trim()) {
      throw new ValidationError('카테고리를 선택해주세요.');
    }
    if (!formData.content?.trim()) {
      throw new ValidationError('내용을 입력해주세요.');
    }

    await prisma.feedback.create({
      data: {
        type: 'EDIT_REQUEST',
        category: formData.category.trim(),
        content: formData.content.trim(),
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
