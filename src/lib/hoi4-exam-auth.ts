import { HOI4_GERMAN_EXAM_2026 } from '@/config/hoi4GermanExam2026';
import { getCalendarData } from '@/lib/data-fetching';
import { resolveHoi4GermanExamBinding } from '@/lib/hoi4-exam-binding';
import { ForbiddenError } from '@/lib/error-handling';

export async function assertAllowedHoi4ExamId(examId: string): Promise<void> {
  const trimmed = examId.trim();
  if (!trimmed) {
    throw new ForbiddenError('연동된 호이고사 일정이 없습니다.');
  }

  const { schedules } = await getCalendarData();
  const binding = resolveHoi4GermanExamBinding(schedules, HOI4_GERMAN_EXAM_2026);
  const allowed = new Set(
    [binding.examId, binding.legacyExamId].filter(
      (value): value is string => Boolean(value),
    ),
  );

  if (!allowed.has(trimmed)) {
    throw new ForbiddenError('유효하지 않은 호이고사 일정입니다.');
  }
}
