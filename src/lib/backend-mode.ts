/**
 * 데이터 백엔드 모드: map-dyoa-server(Fly) vs 로컬 Prisma.
 * MAP_DYOA_SERVER_URL이 있으면 도메인(일정·스트리머·클립 등)은 Fly API만 사용.
 */

import { isScheduleServerEnabled } from '@/lib/map-dyoa-server-schedules';

export {
  getScheduleServerBaseUrl,
  isScheduleServerEnabled,
} from '@/lib/map-dyoa-server-schedules';

/** 로컬 Prisma로 도메인 DB를 읽/쓸 수 있는지 (URL 미설정 시에만 true) */
export function isLocalPrismaDomainEnabled(): boolean {
  return !isScheduleServerEnabled();
}

export function assertLocalPrismaDomainAllowed(context: string): void {
  if (isScheduleServerEnabled()) {
    throw new Error(
      `[${context}] MAP_DYOA_SERVER_URL이 설정된 환경에서는 도메인 Prisma를 사용할 수 없습니다.`,
    );
  }
}
