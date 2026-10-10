import type {
  ClipCandidateScanResult,
  ClipCandidateView,
} from '@/lib/clip-candidate-policy';
import { MapDyoaServerRequestFailedError } from '@/lib/map-dyoa-server-client-error';
import { fetchWithBackoff, readJsonSafely } from '@/lib/map-dyoa-server-http-utils';
import { getScheduleServerBaseUrl } from '@/lib/map-dyoa-server-schedules';

function serverBase(): string {
  const base = getScheduleServerBaseUrl();
  if (!base) {
    throw new Error('Fly 서버 주소가 없습니다.');
  }
  return base;
}

function messageFrom(error: unknown): string {
  if (error instanceof MapDyoaServerRequestFailedError) {
    const bodyMessage = error.body.message;
    if (typeof bodyMessage === 'string' && bodyMessage.trim()) return bodyMessage.trim();
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return '클립 후보 요청에 실패했습니다.';
}

async function fly<T>(
  path: string,
  init?: RequestInit,
  opts?: { maxRetries?: number },
): Promise<T> {
  try {
    const res = await fetchWithBackoff(
      `${serverBase()}${path}`,
      {
        ...init,
        cache: 'no-store',
      },
      opts,
    );
    return await readJsonSafely<T>(res, '클립 후보 API');
  } catch (error) {
    throw new Error(messageFrom(error));
  }
}

export async function scanClipCandidates(): Promise<ClipCandidateScanResult> {
  return fly<ClipCandidateScanResult>(
    '/clip-candidates/scan',
    { method: 'POST' },
    { maxRetries: 0 },
  );
}

export async function listPendingClipCandidates(): Promise<ClipCandidateView[]> {
  const data = await fly<{ candidates: ClipCandidateView[] }>('/clip-candidates');
  return data.candidates ?? [];
}

export async function approveClipCandidate(
  id: string,
  title?: string,
): Promise<{ clipId: string }> {
  return fly<{ clipId: string }>(`/clip-candidates/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: title?.trim() || undefined }),
  });
}

export async function dismissClipCandidate(id: string): Promise<void> {
  await fly(`/clip-candidates/${encodeURIComponent(id)}/dismiss`, { method: 'POST' });
}
