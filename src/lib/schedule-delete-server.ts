import { prisma } from '@/lib/prisma';
import { revalidatePath, updateTag } from 'next/cache';
import { getRevalidationPaths } from '@/constants/revalidation-paths';
import { ValidationError } from '@/lib/error-handling';
import { getScheduleServerBaseUrl } from '@/lib/map-dyoa-server-schedules';

/** 서버 액션·API 라우트에서만 호출 (next/cache 사용) */
export async function runDeleteSchedule(id: string): Promise<void> {
  if (!id?.trim()) {
    throw new ValidationError('유효한 일정 ID가 필요합니다.');
  }

  const base = getScheduleServerBaseUrl();
  if (base) {
    const res = await fetch(`${base}/schedules/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.status === 404) {
      throw new ValidationError('일정을 찾을 수 없습니다.');
    }
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { message?: string };
      throw new ValidationError(
        typeof j.message === 'string' ? j.message : '일정 삭제에 실패했습니다.',
      );
    }
  } else {
    await prisma.schedule.delete({ where: { id } });
  }

  const paths = getRevalidationPaths('schedule');
  await Promise.all([
    ...paths.map((path: string) => revalidatePath(path)),
    updateTag('calendar'),
  ]);
}
