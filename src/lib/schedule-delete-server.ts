import { revalidatePath, updateTag } from 'next/cache';
import { log } from 'next-axiom';
import { getRevalidationPaths } from '@/constants/revalidation-paths';
import { ValidationError } from '@/lib/error-handling';
import { fetchWithBackoff } from '@/lib/map-dyoa-server-http-utils';
import { getScheduleServerBaseUrl } from '@/lib/map-dyoa-server-schedules';
import { getPrismaForDomain } from '@/lib/prisma';

async function revalidateScheduleCaches(): Promise<void> {
  try {
    const paths = getRevalidationPaths('schedule');
    await Promise.all([
      ...paths.map((path: string) => revalidatePath(path)),
      updateTag('calendar'),
    ]);
  } catch (err) {
    log.warn('schedule_delete_revalidate_failed', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/** 서버 액션·API 라우트에서만 호출 (next/cache 사용) */
export async function runDeleteSchedule(id: string): Promise<void> {
  const scheduleId = id?.trim();
  if (!scheduleId) {
    throw new ValidationError('유효한 일정 ID가 필요합니다.');
  }

  const base = getScheduleServerBaseUrl();

  if (!base) {
    try {
      await getPrismaForDomain().schedule.delete({ where: { id: scheduleId } });
    } catch (err) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code: string }).code)
          : '';
      if (code === 'P2025') {
        throw new ValidationError('일정을 찾을 수 없습니다.');
      }
      throw err;
    }
    await revalidateScheduleCaches();
    return;
  }

  const res = await fetchWithBackoff(
    `${base}/schedules/${encodeURIComponent(scheduleId)}`,
    { method: 'DELETE' },
    { maxRetries: 0 },
  );

  if (res.status === 404) {
    throw new ValidationError('일정을 찾을 수 없습니다.');
  }
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { message?: string };
    throw new ValidationError(
      typeof j.message === 'string' ? j.message : '일정 삭제에 실패했습니다.',
    );
  }

  await revalidateScheduleCaches();
}
