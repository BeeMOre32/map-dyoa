'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { requireAuth } from '@/lib/auth-helpers';
import { actorFromSession, logMutation } from '@/lib/audit-log';
import { getRevalidationPaths } from '@/constants/revalidation-paths';
import {
  approveClipCandidate,
  dismissClipCandidate,
  listPendingClipCandidates,
  scanClipCandidates,
  type ClipCandidateScanResult,
} from '@/lib/clip-candidate-store';
import type { ClipCandidateView } from '@/lib/clip-candidate-policy';
import { getErrorMessage, logError } from '@/lib/error-handling';
import type { ActionResult } from '@/types/api-response';

export type { ClipCandidateView };

export type ClipCandidatesPayload = {
  candidates: ClipCandidateView[];
  scanned: boolean;
  created: number;
};

function isAlreadyResolvedError(message: string): boolean {
  return (
    message.includes('이미 등록') ||
    message.includes('이미 거절') ||
    message.includes('이미 처리')
  );
}

export async function listClipCandidatesAction(): Promise<
  ActionResult<ClipCandidatesPayload>
> {
  try {
    await requireAuth();
    const candidates = await listPendingClipCandidates();
    return {
      success: true,
      data: { candidates, scanned: false, created: 0 },
    };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('listClipCandidates', error);
    return { success: false, error: message, errorCode: code };
  }
}

export async function refreshClipCandidatesAction(opts?: {
  scan?: boolean;
}): Promise<ActionResult<ClipCandidatesPayload & { scan?: ClipCandidateScanResult }>> {
  try {
    await requireAuth();
    let scan: ClipCandidateScanResult | undefined;
    if (opts?.scan) scan = await scanClipCandidates();
    const candidates = await listPendingClipCandidates();
    return {
      success: true,
      data: {
        candidates,
        scanned: Boolean(scan),
        created: scan?.created ?? 0,
        scan,
      },
    };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('refreshClipCandidates', error);
    return { success: false, error: message, errorCode: code };
  }
}

export async function registerClipCandidateAction(
  id: string,
  title?: string,
): Promise<ActionResult<{ clipId: string }>> {
  try {
    const session = await requireAuth();
    const created = await approveClipCandidate(id, title);
    const paths = getRevalidationPaths('clip');
    await Promise.all([
      ...paths.map((path) => revalidatePath(path)),
      updateTag('clips'),
    ]);
    logMutation({
      actor: actorFromSession(session),
      action: 'create',
      entity: 'clip',
      entityId: created.clipId,
      summary: `클립 후보 등록: ${(title ?? '').trim() || id}`,
    });
    return { success: true, data: { clipId: created.clipId } };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('registerClipCandidate', error);
    if (isAlreadyResolvedError(message)) {
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

export async function dismissClipCandidateAction(
  id: string,
): Promise<ActionResult> {
  try {
    await requireAuth();
    await dismissClipCandidate(id);
    return { success: true, data: null };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('dismissClipCandidate', error);
    if (isAlreadyResolvedError(message)) {
      return {
        success: false,
        error: '이미 처리된 후보입니다. 목록을 갱신합니다.',
        errorCode: 'ALREADY_RESOLVED',
      };
    }
    return { success: false, error: message, errorCode: code };
  }
}
