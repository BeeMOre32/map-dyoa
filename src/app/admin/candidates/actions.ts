'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth-helpers';
import { getErrorMessage, logError } from '@/lib/error-handling';
import type { ActionResult } from '@/types/api-response';
import {
  approveScheduleCandidate,
  dismissScheduleCandidate,
  scanLiveScheduleCandidates,
} from '@/lib/schedule-candidate-store';

function revalidateCandidatePages() {
  revalidatePath('/admin/candidates');
  revalidatePath('/admin');
  revalidatePath('/calendar');
}

export async function scanScheduleCandidatesAction(): Promise<
  ActionResult<{
    dateKst: string;
    liveCount: number;
    created: number;
    refreshed: number;
    skippedScheduled: number;
    skippedResolved: number;
  }>
> {
  try {
    await requireAdmin();
    const data = await scanLiveScheduleCandidates();
    revalidateCandidatePages();
    return { success: true, data };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('scanScheduleCandidates', error);
    return { success: false, error: message, errorCode: code };
  }
}

export async function approveScheduleCandidateAction(
  id: string,
  title?: string,
  participantIds?: string[],
  gameId?: string | null,
): Promise<ActionResult<{ scheduleId: string }>> {
  try {
    await requireAdmin();
    const data = await approveScheduleCandidate(id, {
      title,
      participantIds,
      gameId: gameId || null,
    });
    revalidateCandidatePages();
    return { success: true, data };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('approveScheduleCandidate', error);
    if (
      message.includes('이미 등록') ||
      message.includes('이미 거절') ||
      message.includes('이미 처리')
    ) {
      return {
        success: false,
        error: message.includes('거절')
          ? '이미 거절된 후보입니다. 목록을 갱신합니다.'
          : '이미 등록된 후보입니다. 목록을 갱신합니다.',
        errorCode: 'ALREADY_RESOLVED',
      };
    }
    return { success: false, error: message, errorCode: code };
  }
}

export async function dismissScheduleCandidateAction(
  id: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    await dismissScheduleCandidate(id);
    revalidateCandidatePages();
    return { success: true, data: null };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('dismissScheduleCandidate', error);
    return { success: false, error: message, errorCode: code };
  }
}
