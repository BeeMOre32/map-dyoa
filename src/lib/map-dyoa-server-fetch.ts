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
export function apiMutationMessage(
  status: number,
  json: ApiJson,
  fallback: string,
): string {
  if (status === 400 && json.error === 'VALIDATION') {
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
  return fallback;
}
