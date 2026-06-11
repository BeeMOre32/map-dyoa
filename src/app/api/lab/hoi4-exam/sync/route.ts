import { NextResponse } from 'next/server';
import { HOI4_GERMAN_EXAM_2026 } from '@/config/hoi4GermanExam2026';
import { getHoi4ExamEntries } from '@/lib/hoi4-exam-entries';
import { getHoi4ExamRuntimeState } from '@/lib/hoi4-exam-state';

export const dynamic = 'force-dynamic';

export async function GET() {
  const examId = HOI4_GERMAN_EXAM_2026.id;
  const [runtime, entries] = await Promise.all([
    getHoi4ExamRuntimeState(examId),
    getHoi4ExamEntries(examId),
  ]);
  return NextResponse.json({ runtime, entries });
}
