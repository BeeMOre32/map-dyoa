import { NextResponse } from 'next/server';
import { HOI4_GERMAN_EXAM_2026 } from '@/config/hoi4GermanExam2026';
import { assertAllowedHoi4ExamId } from '@/lib/hoi4-exam-auth';
import { loadHoi4ExamRuntimeForBinding } from '@/lib/hoi4-exam-load';
import { getCalendarData } from '@/lib/data-fetching';
import { resolveHoi4GermanExamBinding } from '@/lib/hoi4GermanExam';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const examIdParam = new URL(request.url).searchParams.get('examId');

  try {
    const { schedules } = await getCalendarData();
    const binding = resolveHoi4GermanExamBinding(schedules, HOI4_GERMAN_EXAM_2026);
    const examId = examIdParam?.trim() || binding.examId;

    if (!examId) {
      return NextResponse.json({ manualStartedAt: null, manualEndedAt: null });
    }

    await assertAllowedHoi4ExamId(examId);
    const state = await loadHoi4ExamRuntimeForBinding({ ...binding, examId });
    return NextResponse.json(state);
  } catch (error) {
    const message = error instanceof Error ? error.message : '조회에 실패했습니다.';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
