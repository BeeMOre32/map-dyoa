'use server';

import { headers } from 'next/headers';
import { revalidatePath, updateTag } from 'next/cache';
import { getRevalidationPaths } from '@/constants/revalidation-paths';
import { logError } from '@/lib/error-handling';
import { submitFeedbackCore } from '@/lib/feedback-submit';
import {
  parseSiteFeedbackCategory,
  parseSiteFeedbackPage,
  sanitizeSiteFeedbackContent,
  takeSiteFeedbackSlot,
} from '@/lib/site-feedback';

const CONTENT_MIN = 8;
const CONTENT_MAX = 800;

export type SiteFeedbackResult = { ok: true } | { ok: false; error: string };

async function clientKey(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || headerList.get('x-real-ip')?.trim() || 'unknown';
  return ip.slice(0, 80);
}

export async function submitSiteFeedbackAction(input: {
  category?: unknown;
  content?: unknown;
  page?: unknown;
  company?: unknown;
}): Promise<SiteFeedbackResult> {
  const key = await clientKey();

  if (typeof input.company === 'string' && input.company.trim()) {
    takeSiteFeedbackSlot(key);
    return { ok: true };
  }

  const category = parseSiteFeedbackCategory(input.category);
  const content = sanitizeSiteFeedbackContent(typeof input.content === 'string' ? input.content : '');
  if (!category || content.length < CONTENT_MIN || content.length > CONTENT_MAX) {
    return { ok: false, error: '분류를 고르고 8자 이상 800자 이내로 적어주세요.' };
  }

  if (!takeSiteFeedbackSlot(key)) {
    return { ok: false, error: '잠시 후 다시 보내주세요.' };
  }

  const page = parseSiteFeedbackPage(input.page);
  const stored = page ? `${content}\n\n페이지: ${page}` : content;

  const inserted = await submitFeedbackCore({
    category,
    content: stored,
    streamerName: '사이트',
    type: category === '오류' ? 'ERROR_REPORT' : 'EDIT_REQUEST',
  });

  if (!inserted.ok) {
    logError('submitSiteFeedback', inserted.error);
    return { ok: false, error: '지금은 보내지 못했습니다. 잠시 후 다시 시도해주세요.' };
  }

  try {
    const paths = getRevalidationPaths('admin');
    await Promise.all(paths.map((path) => revalidatePath(path)));
    updateTag('admin');
  } catch (error) {
    logError('submitSiteFeedbackRevalidate', error);
  }

  return { ok: true };
}
