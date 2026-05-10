import type { ActionResult } from '@/types/api-response';

/** 브라우저에서 일정 삭제 (Server Action ID 불일치 회피용 API 호출) */
export async function deleteScheduleRequest(id: string): Promise<ActionResult> {
  const res = await fetch(`/api/schedules/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { success: false, error: '서버 응답을 해석하지 못했습니다.' };
  }

  const parsed = body as ActionResult;
  if (parsed && typeof parsed === 'object' && 'success' in parsed) {
    return parsed;
  }

  return { success: false, error: '삭제 요청에 실패했습니다.' };
}
