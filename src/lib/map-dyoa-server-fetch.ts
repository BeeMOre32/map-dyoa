import { getScheduleServerBaseUrl } from './map-dyoa-server-schedules';
import { SCHEDULE_CONFLICT_MESSAGE } from './schedule-concurrency';

export { fetchWithBackoff, readJsonSafely } from './map-dyoa-server-http-utils';

export function requireServerBaseUrl(): string {
  const base = getScheduleServerBaseUrl();
  if (!base) throw new Error('MAP_DYOA_SERVER_URL이 설정되지 않았습니다.');
  return base;
}

export type ApiJson = Record<string, unknown>;

export async function readApiJson(res: Response): Promise<ApiJson> {
  try {
    const text = await res.text();
    if (!text.trim()) return {};
    return JSON.parse(text) as ApiJson;
  } catch {
    return {};
  }
}

/** 서버 액션용 공통 오류 메시지 */
/** Fly API 일정 본문용 — `result: null` 은 Zod optional(string) 에서 거절됨 */
export function scheduleParticipantsForApi(
  participants: { id: string; nation?: string; result?: string; isGuest?: boolean }[],
) {
  return participants.map(({ id, nation, result, isGuest }) => {
    const trimmedNation = nation?.trim();
    const trimmedResult = result?.trim();
    return {
      id,
      ...(trimmedNation ? { nation: trimmedNation } : {}),
      ...(trimmedResult ? { result: trimmedResult } : {}),
      isGuest: isGuest ?? false,
    };
  });
}

export function apiMutationMessage(
  status: number,
  json: ApiJson,
  fallback: string,
): string {
  if (status === 409 || json.error === 'CONFLICT') {
    return typeof json.message === 'string' && json.message.trim()
      ? json.message.trim()
      : SCHEDULE_CONFLICT_MESSAGE;
  }
  if (status === 400 && json.error === 'VALIDATION') {
    const issues = json.issues as
      | { fieldErrors?: Record<string, string[]>; formErrors?: string[] }
      | undefined;
    const firstField =
      issues?.fieldErrors &&
      Object.values(issues.fieldErrors).flat().find(Boolean);
    const firstForm = issues?.formErrors?.[0];
    if (firstField || firstForm) {
      return firstField ?? firstForm ?? '입력 값을 확인해주세요.';
    }
    return '입력 값을 확인해주세요.';
  }
  if (json.error === 'DUPLICATE_ENTRY') {
    return typeof json.message === 'string'
      ? json.message
      : '이미 사용 중인 값입니다.';
  }
  if (typeof json.message === 'string' && json.message.trim()) {
    return json.message.trim();
  }
  if (json.error === 'INTERNAL') {
    return typeof json.message === 'string' && json.message.trim()
      ? json.message.trim()
      : fallback;
  }
  return fallback;
}
