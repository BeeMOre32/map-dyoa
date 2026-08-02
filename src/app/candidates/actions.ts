'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth-helpers';
import { actorFromSession, logMutation } from '@/lib/audit-log';
import { getErrorMessage, logError } from '@/lib/error-handling';
import type { ActionResult } from '@/types/api-response';
import {
  approveScheduleCandidate,
  listScheduleCandidates,
  scanLiveScheduleCandidates,
  type ScheduleCandidateView,
} from '@/lib/schedule-candidate-store';

export type LiveCandidatesPayload = {
  candidates: ScheduleCandidateView[];
  /** 후보 lastSeenAt 중 최신 (ISO). 없으면 null */
  freshnessAt: string | null;
  scanned?: boolean;
};

function revalidateCandidateSurfaces() {
  revalidatePath('/admin/candidates');
  revalidatePath('/admin');
  revalidatePath('/calendar');
}

function freshnessFrom(candidates: ScheduleCandidateView[]): string | null {
  let max = 0;
  for (const c of candidates) {
    const t = new Date(c.lastSeenAt).getTime();
    if (Number.isFinite(t) && t > max) max = t;
  }
  return max > 0 ? new Date(max).toISOString() : null;
}

async function loadPendingPayload(): Promise<LiveCandidatesPayload> {
  const candidates = await listScheduleCandidates({
    status: 'PENDING',
    limit: 40,
  });
  return {
    candidates,
    freshnessAt: freshnessFrom(candidates),
  };
}

function isAlreadyResolvedError(message: string): boolean {
  return (
    message.includes('이미 등록') ||
    message.includes('이미 거절') ||
    message.includes('이미 처리')
  );
}

/** 로그인 유저: 오늘 LIVE 대기 후보만 */
export async function listPendingLiveCandidatesAction(): Promise<
  ActionResult<LiveCandidatesPayload>
> {
  try {
    await requireAuth();
    const data = await loadPendingPayload();
    return { success: true, data };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('listPendingLiveCandidates', error);
    return { success: false, error: message, errorCode: code };
  }
}

/**
 * 목록 새로고침. scan=true면 LIVE 스캔 후 목록 (유저 轻度 갱신).
 * 스캔은 치지직 호출이 있어 클라이언트가 간격을 두는 것을 권장.
 */
export async function refreshPendingLiveCandidatesAction(
  opts?: { scan?: boolean },
): Promise<ActionResult<LiveCandidatesPayload>> {
  try {
    await requireAuth();
    let scanned = false;
    if (opts?.scan) {
      await scanLiveScheduleCandidates();
      scanned = true;
      revalidatePath('/admin/candidates');
      revalidatePath('/admin');
    }
    const data = await loadPendingPayload();
    return { success: true, data: { ...data, scanned } };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('refreshPendingLiveCandidates', error);
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
    if (isAlreadyResolvedError(message)) {
      return {
        success: false,
        error:
          message.includes('거절')
            ? '이미 거절된 후보입니다. 목록을 갱신합니다.'
            : '이미 등록된 후보입니다. 목록을 갱신합니다.',
        errorCode: 'ALREADY_RESOLVED',
      };
    }
    return { success: false, error: message, errorCode: code };
  }
}
