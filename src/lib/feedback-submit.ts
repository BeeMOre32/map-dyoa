/**
 * 피드백 DB·map-dyoa-server 반영 (서버 액션·Route Handler 공통).
 * `revalidatePath` 등은 호출 쪽에서 처리.
 *
 * `NODE_ENV === 'development'` 이고 `DATABASE_URL`이 있으면, 원격 `POST /feedbacks`가
 * 실패(HTTP 오류·네트워크)할 때 Prisma로 한 번 더 저장합니다. (로컬에서 Fly만 깨진 경우)
 * 비활성화: `FEEDBACK_DEV_PRISMA_FALLBACK=0`
 */

import { prisma } from '@/lib/prisma';
import { fetchWithBackoff } from '@/lib/map-dyoa-server-http-utils';
import { getScheduleServerBaseUrl } from '@/lib/map-dyoa-server-schedules';

export type SubmitFeedbackCoreInput = {
  category: string;
  content: string;
  streamerId?: string;
  streamerName?: string;
  type?: 'EDIT_REQUEST' | 'ERROR_REPORT';
};

function remoteFeedbackErrorMessage(
  status: number,
  json: Record<string, unknown>,
): string {
  if (typeof json.message === 'string' && json.message.trim()) return json.message.trim();
  const issues = json.issues;
  if (issues && typeof issues === 'object') {
    try {
      const s = JSON.stringify(issues);
      if (s.length > 2) return `검증 오류: ${s.slice(0, 500)}`;
    } catch {
      /* ignore */
    }
  }
  if (typeof json.error === 'string' && json.error.trim()) {
    return `백엔드 응답: ${json.error} (HTTP ${status})`;
  }
  return `피드백 API 실패 (HTTP ${status})`;
}

async function persistFeedbackViaPrisma(input: {
  feedbackType: 'EDIT_REQUEST' | 'ERROR_REPORT';
  categoryTrim: string;
  contentOut: string;
  streamerId?: string;
  streamerName?: string;
}): Promise<{ ok: true } | { ok: false; error: string; errorCode?: string }> {
  try {
    await prisma.feedback.create({
      data: {
        type: input.feedbackType,
        category: input.categoryTrim,
        content: input.contentOut,
        streamerId: input.streamerId?.trim() || null,
        streamerName: input.streamerName?.trim() || null,
      },
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg, errorCode: 'PRISMA_ERROR' };
  }
}

export async function submitFeedbackCore(
  input: SubmitFeedbackCoreInput,
): Promise<{ ok: true } | { ok: false; error: string; errorCode?: string }> {
  const feedbackType = input.type === 'ERROR_REPORT' ? 'ERROR_REPORT' : 'EDIT_REQUEST';
  const categoryTrim = input.category.trim();
  const contentTrimmed = input.content.trim();
  const contentOut =
    contentTrimmed.length > 5000 ? contentTrimmed.slice(0, 5000) : contentTrimmed;

  if (!categoryTrim || !contentOut) {
    return { ok: false, error: '카테고리와 내용을 입력해주세요.', errorCode: 'VALIDATION' };
  }

  const streamerId = input.streamerId?.trim() || undefined;
  const streamerName = input.streamerName?.trim() || undefined;

  const base = getScheduleServerBaseUrl();
  const devPrismaFallback =
    process.env.NODE_ENV === 'development' &&
    Boolean(process.env.DATABASE_URL?.trim()) &&
    process.env.FEEDBACK_DEV_PRISMA_FALLBACK !== '0';

  if (base) {
    try {
      const res = await fetchWithBackoff(`${base}/feedbacks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: feedbackType,
          streamerId,
          streamerName,
          category: categoryTrim,
          content: contentOut,
        }),
      });

      let json: Record<string, unknown> = {};
      try {
        const text = await res.text();
        if (text.trim()) json = JSON.parse(text) as Record<string, unknown>;
      } catch {
        json = {};
      }

      if (res.ok) {
        return { ok: true };
      }

      const remoteErr = remoteFeedbackErrorMessage(res.status, json);

      if (devPrismaFallback) {
        console.warn(
          '[submitFeedbackCore] remote /feedbacks failed, dev Prisma fallback:',
          res.status,
          remoteErr,
        );
        const local = await persistFeedbackViaPrisma({
          feedbackType,
          categoryTrim,
          contentOut,
          streamerId,
          streamerName,
        });
        if (local.ok) return { ok: true };
        return {
          ok: false,
          error: `${remoteErr} · 로컬 DB 폴백도 실패: ${local.error}`,
          errorCode: 'REMOTE_AND_LOCAL_FAILED',
        };
      }

      return {
        ok: false,
        error: remoteErr,
        errorCode: typeof json.error === 'string' ? json.error : 'API_ERROR',
      };
    } catch (e) {
      const netMsg = e instanceof Error ? e.message : String(e);
      if (devPrismaFallback) {
        console.warn('[submitFeedbackCore] remote fetch threw, dev Prisma fallback:', netMsg);
        const local = await persistFeedbackViaPrisma({
          feedbackType,
          categoryTrim,
          contentOut,
          streamerId,
          streamerName,
        });
        if (local.ok) return { ok: true };
        return {
          ok: false,
          error: `원격 요청 실패: ${netMsg} · 로컬 DB 폴백도 실패: ${local.error}`,
          errorCode: 'REMOTE_AND_LOCAL_FAILED',
        };
      }
      return { ok: false, error: netMsg, errorCode: 'NETWORK' };
    }
  }

  return persistFeedbackViaPrisma({
    feedbackType,
    categoryTrim,
    contentOut,
    streamerId,
    streamerName,
  });
}
