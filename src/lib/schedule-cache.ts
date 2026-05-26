import { revalidatePath, updateTag } from 'next/cache';
import { getRevalidationPaths } from '@/constants/revalidation-paths';

/** 일정·HOI4 전적 Data Cache / fetch 태그 */
export const SCHEDULE_DATA_CACHE_TAGS = ['calendar', 'hoi4'] as const;

/** 일정 생성·수정·삭제 후 캘린더·HOI4 페이지와 관련 캐시 무효화 */
export async function revalidateScheduleDataCaches(): Promise<void> {
  const paths = getRevalidationPaths('schedule');
  await Promise.all([
    ...paths.map((path) => revalidatePath(path)),
    ...SCHEDULE_DATA_CACHE_TAGS.map((tag) => updateTag(tag)),
  ]);
}
