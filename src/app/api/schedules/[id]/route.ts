import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { getErrorMessage, logError } from '@/lib/error-handling';
import { runDeleteSchedule } from '@/lib/schedule-delete-server';
import type { ActionResult } from '@/types/api-response';

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
    const { id } = await context.params;
    await runDeleteSchedule(id);
    return NextResponse.json<ActionResult>({ success: true, data: null });
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    logError('deleteScheduleApi', error);
    const status =
      code === 'UNAUTHORIZED' ? 401 : code === 'FORBIDDEN' ? 403 : code === 'NOT_FOUND' ? 404 : 400;
    return NextResponse.json<ActionResult>(
      { success: false, error: message, errorCode: code },
      { status },
    );
  }
}
