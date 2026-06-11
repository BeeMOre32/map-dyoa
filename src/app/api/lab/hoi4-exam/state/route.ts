import { NextResponse } from 'next/server';
import { HOI4_GERMAN_EXAM_2026 } from '@/config/hoi4GermanExam2026';
import { getHoi4ExamRuntimeState } from '@/lib/hoi4-exam-state';

export const dynamic = 'force-dynamic';

export async function GET() {
  const state = await getHoi4ExamRuntimeState(HOI4_GERMAN_EXAM_2026.id);
  return NextResponse.json(state);
}
