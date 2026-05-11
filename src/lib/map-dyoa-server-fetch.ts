import { getScheduleServerBaseUrl } from './map-dyoa-server-schedules';

export function requireServerBaseUrl(): string {
  const base = getScheduleServerBaseUrl();
  if (!base) throw new Error('MAP_DYOA_SERVER_URL이 설정되지 않았습니다.');
  return base;
}

export async function readJsonSafely<T>(
  res: Response,
  fallbackMessage: string,
): Promise<T> {
  const raw = await res.text();
  let data: unknown = {};
  if (raw.trim().length > 0) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { message: raw };
    }
  }
  if (!res.ok) {
    const message =
      typeof (data as { message?: unknown }).message === 'string'
        ? (data as { message: string }).message
        : fallbackMessage;
    throw new Error(message);
  }
  return data as T;
}
