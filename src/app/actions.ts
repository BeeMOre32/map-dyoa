// src/app/actions.ts
'use server';

import { prisma } from '@/src/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/src/auth';

export async function createScheduleAction(data: {
  title: string;
  startTime: Date;
  streamerIds: string[];
}) {
  const session = await auth();
  if (!session) {
    return { success: false, error: '권한이 없습니다.' };
  }
  try {
    await prisma.schedule.create({
      data: {
        title: data.title,
        startTime: data.startTime,
        participants: {
          create: data.streamerIds.map((id) => ({
            streamer: { connect: { id: id } },
          })),
        },
      },
    });

    revalidatePath('/calendar');
    revalidatePath('/schedule');
    return { success: true };
  } catch (error) {
    console.error('일정 생성 실패:', error);
    return { success: false };
  }
}

export async function deleteScheduleAction(id: string) {
  const session = await auth();
  if (!session) {
    return { success: false, error: '권한이 없습니다.' };
  }
  try {
    await prisma.schedule.delete({ where: { id } });
    revalidatePath('/calendar');
    revalidatePath('/schedule');
    return { success: true };
  } catch (error) {
    console.error('일정 삭제 실패:', error);
    return { success: false };
  }
}

export async function updateScheduleAction(
  id: string,
  data: {
    title: string;
    startTime: Date;
    streamerIds: string[];
    gameId?: string;
  },
) {
  try {
    await prisma.schedule.update({
      where: { id },
      data: {
        title: data.title,
        startTime: data.startTime,
        gameId: data.gameId || null,
        participants: {
          deleteMany: {},
          create: data.streamerIds.map((streamerId) => ({
            streamer: { connect: { id: streamerId } },
          })),
        },
      },
    });

    revalidatePath('/calendar');
    revalidatePath('/schedule');
    return { success: true };
  } catch (error) {
    console.error('일정 수정 실패:', error);
    return { success: false };
  }
}

export async function createStreamerAction(data: {
  name: string;
  handle: string;
  generation: number;
  role: string;
  platform: string;
  colorCode: string;
  chzzkUrl: string;
}) {
  try {
    await prisma.streamer.create({
      data: {
        name: data.name,
        handle: data.handle,
        generation: data.generation,
        role: data.role || null,
        platform: data.platform,
        colorCode: data.colorCode,
        chzzkUrl: data.chzzkUrl || null,
      },
    });

    revalidatePath('/streamers');
    revalidatePath('/calendar');
    return { success: true };
  } catch (error) {
    console.error('방송인 추가 실패:', error);
    return { success: false };
  }
}

export async function bulkCreateStreamersAction(streamersData: any[]) {
  try {
    await prisma.streamer.createMany({
      data: streamersData,
      skipDuplicates: true, // 영문 ID(handle)가 겹치면 무시하고 다음 사람을 넣습니다.
    });
    return { success: true };
  } catch (error) {
    console.error('일괄 추가 실패:', error);
    return { success: false, error };
  }
}

export async function createFeedbackAction(formData: {
  streamerId: string;
  streamerName: string;
  category: string;
  content: string;
}) {
  try {
    await prisma.feedback.create({
      data: {
        type: 'EDIT_REQUEST',
        category: formData.category,
        content: formData.content,
        streamerId: formData.streamerId,
        streamerName: formData.streamerName,
      },
    });

    revalidatePath('/admin/feedbacks');

    return { success: true };
  } catch (error) {
    console.error('Feedback Error:', error);
    return { success: false, error: '요청을 보내는 중 오류가 발생했습니다.' };
  }
}
