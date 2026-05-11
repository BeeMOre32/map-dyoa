import { getScheduleServerBaseUrl } from './map-dyoa-server-schedules';

export { fetchWithBackoff, readJsonSafely } from './map-dyoa-server-http-utils';

export function requireServerBaseUrl(): string {
  const base = getScheduleServerBaseUrl();
  if (!base) throw new Error('MAP_DYOA_SERVER_URL이 설정되지 않았습니다.');
  return base;
}
