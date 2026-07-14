'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth-helpers';
import { actorFromSession, logMutation } from '@/lib/audit-log';
import { getErrorMessage, logError } from '@/lib/error-handling';
import type { ActionResult } from '@/types/api-response';
import {
  approveScheduleCandidate,
  listScheduleCandidates,
  type ScheduleCandidateView,
} from '@/lib/schedule-candidate-store';

function revalidateCandidateSurfaces() {
  revalidatePath('/admin/candidates');
  revalidatePath('/admin');
  revalidatePath('/calendar');
}

/** 로그인 유저: 오늘 LIVE 대기 후보만 */
export async function listPendingLiveCandidatesAction(): Promise<
  ActionResult<ScheduleCandidateView[]>
> {
  try {
    await requireAuth();
    const data = await listScheduleCandidates({ status: 'PENDING', limit: 40 });
    return { success: true, data };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('listPendingLiveCandidates', error);
    return { success: false, error: message, errorCode: code };
  }
}

/** 로그인 유저: 후보 → 일정 등록 (감지 시각) */
export async function registerLiveCandidateAction(
  id: string,
  title?: string,
  participantIds?: string[],
  gameId?: string | null,
): Promise<ActionResult<{ scheduleId: string }>> {
  try {
    const session = await requireAuth();
    const data = await approveScheduleCandidate(id, {
      title,
      participantIds,
      gameId: gameId || null,
    });
    logMutation({
      actor: actorFromSession(session),
      action: 'create',
      entity: 'schedule',
      entityId: data.scheduleId,
      summary: `LIVE 후보 등록: ${(title ?? '').trim() || id}`,
    });
    revalidateCandidateSurfaces();
    return { success: true, data };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('registerLiveCandidate', error);
    return { success: false, error: message, errorCode: code };
  }
}
