/**
 * 캐시 재검증 경로 통합
 * 서버 액션에서 사용할 재검증 경로 정의
 */

export const REVALIDATION_PATHS = {
  calendar: ['/calendar', '/streamers'],
  schedule: ['/calendar', '/hoi4'],
  streamer: ['/calendar', '/streamers'],
  admin: ['/admin', '/admin/feedbacks'],
  clip: ['/clips'],
} as const;

export type RevalidationType = keyof typeof REVALIDATION_PATHS;

/**
 * 재검증 경로 가져오기
 */
export function getRevalidationPaths(
  type: RevalidationType,
): readonly string[] {
  return REVALIDATION_PATHS[type];
}

/**
 * 복수의 타입에 대해 재검증 경로 가져오기
 */
export function getRevalidationPathsMulti(types: RevalidationType[]): string[] {
  const paths = new Set<string>();
  types.forEach((type) => {
    getRevalidationPaths(type).forEach((path) => paths.add(path));
  });
  return Array.from(paths);
}
