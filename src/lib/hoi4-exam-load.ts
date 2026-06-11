import type { Hoi4GermanExamEntry } from '@/config/hoi4GermanExam2026';
import type { Hoi4GermanExamBinding } from '@/lib/hoi4-exam-binding';
import { getHoi4ExamEntries } from '@/lib/hoi4-exam-entries';
import {
  getHoi4ExamRuntimeState,
  type Hoi4ExamRuntimeState,
} from '@/lib/hoi4-exam-state';

const EMPTY_RUNTIME: Hoi4ExamRuntimeState = {
  manualStartedAt: null,
  manualEndedAt: null,
};

function hasRuntimeData(state: Hoi4ExamRuntimeState): boolean {
  return Boolean(state.manualStartedAt || state.manualEndedAt);
}

async function loadRuntimeByExamId(examId: string): Promise<Hoi4ExamRuntimeState> {
  return getHoi4ExamRuntimeState(examId);
}

async function loadEntriesByExamId(examId: string): Promise<Hoi4GermanExamEntry[]> {
  return getHoi4ExamEntries(examId);
}

/** 일정 id 우선, 없으면 legacy yyyy-MM-dd 키로 조회 */
export async function loadHoi4ExamRuntimeForBinding(
  binding: Hoi4GermanExamBinding,
): Promise<Hoi4ExamRuntimeState> {
  if (!binding.examId) return EMPTY_RUNTIME;

  const primary = await loadRuntimeByExamId(binding.examId);
  if (hasRuntimeData(primary)) return primary;

  if (
    binding.legacyExamId &&
    binding.legacyExamId !== binding.examId
  ) {
    const legacy = await loadRuntimeByExamId(binding.legacyExamId);
    if (hasRuntimeData(legacy)) return legacy;
  }

  return primary;
}

export async function loadHoi4ExamEntriesForBinding(
  binding: Hoi4GermanExamBinding,
): Promise<Hoi4GermanExamEntry[]> {
  if (!binding.examId) return [];

  const primary = await loadEntriesByExamId(binding.examId);
  if (primary.length > 0) return primary;

  if (
    binding.legacyExamId &&
    binding.legacyExamId !== binding.examId
  ) {
    const legacy = await loadEntriesByExamId(binding.legacyExamId);
    if (legacy.length > 0) return legacy;
  }

  return primary;
}
