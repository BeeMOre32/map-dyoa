/**
 * API 응답 표준화
 * 모든 서버 액션의 응답은 이 타입을 준수합니다.
 */

export type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string; errorCode?: string };

/**
 * 페이지네이션 응답
 */
export type PaginatedResult<T> = {
  success: true;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * API 에러 코드
 */
export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  SERVER_ERROR = 'SERVER_ERROR',
}
