import type { useRouter } from 'next/navigation';
import type { ActionResult } from '@/types/api-response';

type AppRouter = ReturnType<typeof useRouter>;

/** 삭제 성공 후 메인 캘린더로 이동 (parallel @modal 닫기) */
export function navigateToCalendarAfterDelete(router: AppRouter) {
  router.replace('/calendar');
  router.refresh();
}

/** 브라우저에서 일정 삭제 (Server Action ID 불일치 회피용 API 호출) */
export async function deleteScheduleRequest(id: string): Promise<ActionResult> {
  const res = await fetch(`/api/schedules/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (res.status === 204) {
    return { success: true, data: null };
  }

  let body: unknown;
  try {
    const text = await res.text();
    if (!text.trim()) {
      if (res.ok) return { success: true, data: null };
      return { success: false, error: '삭제 요청에 실패했습니다.' };
    }
    body = JSON.parse(text);
  } catch {
    if (res.ok) return { success: true, data: null };
    return { success: false, error: '서버 응답을 해석하지 못했습니다.' };
  }

  const parsed = body as ActionResult;
  if (parsed && typeof parsed === 'object' && 'success' in parsed) {
    return parsed;
  }

  if (res.ok) return { success: true, data: null };
  return { success: false, error: '삭제 요청에 실패했습니다.' };
}
