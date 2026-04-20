/**
 * 인증 헬퍼 함수
 * 서버 액션에서 사용할 인증 검증 함수 통합
 */

import { auth } from '@/auth';
import { UnauthorizedError, ForbiddenError } from '@/lib/error-handling';

/**
 * 로그인 여부 확인
 */
export async function requireAuth() {
  const session = await auth();
  if (!session) {
    throw new UnauthorizedError('로그인이 필요합니다.');
  }
  return session;
}

/**
 * 관리자 여부 확인
 */
export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user?.role !== 'ADMIN') {
    throw new ForbiddenError('관리자 권한이 필요합니다.');
  }
  return session;
}

/**
 * 특정 역할 확인
 */
export async function requireRole(...roles: string[]) {
  const session = await requireAuth();
  if (!session.user?.role || !roles.includes(session.user.role)) {
    throw new ForbiddenError(`${roles.join(', ')} 권한이 필요합니다.`);
  }
  return session;
}
