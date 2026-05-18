import { getScheduleServerBaseUrl } from './map-dyoa-server-schedules';

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
  participants: { id: string; nation?: string; isGuest?: boolean }[],
) {
  return participants.map(({ id, nation, isGuest }) => {
    const trimmed = nation?.trim();
    return {
      id,
      ...(trimmed ? { nation: trimmed } : {}),
      isGuest: isGuest ?? false,
    };
  });
}

export function apiMutationMessage(
  status: number,
  json: ApiJson,
  fallback: string,
): string {
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
