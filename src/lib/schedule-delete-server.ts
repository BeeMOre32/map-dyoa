import { prisma } from '@/lib/prisma';
import { revalidatePath, updateTag } from 'next/cache';
import { getRevalidationPaths } from '@/constants/revalidation-paths';
import { ValidationError } from '@/lib/error-handling';

/** 서버 액션·API 라우트에서만 호출 (next/cache 사용) */
export async function runDeleteSchedule(id: string): Promise<void> {
  if (!id?.trim()) {
    throw new ValidationError('유효한 일정 ID가 필요합니다.');
  }

  await prisma.schedule.delete({ where: { id } });

  const paths = getRevalidationPaths('schedule');
  await Promise.all([
    ...paths.map((path: string) => revalidatePath(path)),
    updateTag('calendar'),
  ]);
}
