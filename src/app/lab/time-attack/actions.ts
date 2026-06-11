'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth-helpers';
import type { Hoi4GermanExamEntry } from '@/config/hoi4GermanExam2026';
import {
  deleteHoi4ExamEntry,
  getHoi4ExamEntries,
  upsertHoi4ExamEntry,
  type UpsertHoi4ExamEntryInput,
} from '@/lib/hoi4-exam-entries';
import { assertAllowedHoi4ExamId } from '@/lib/hoi4-exam-auth';
import {
  adjustHoi4ExamRuntimeTimes,
  getHoi4ExamRuntimeState,
  resetHoi4ExamRuntime,
  setHoi4ExamEnded,
  setHoi4ExamStarted,
  type Hoi4ExamRuntimeState,
} from '@/lib/hoi4-exam-state';
import { kstDatetimeLocalToIso } from '@/lib/hoi4-exam-time';
import type { ActionResult } from '@/types/api-response';

function revalidateExamPage() {
  revalidatePath('/lab/time-attack');
}

function okState(data: Hoi4ExamRuntimeState): ActionResult<Hoi4ExamRuntimeState> {
  revalidateExamPage();
  return { success: true, data };
}

function okEntries(data: Hoi4GermanExamEntry[]): ActionResult<Hoi4GermanExamEntry[]> {
  revalidateExamPage();
  return { success: true, data };
}

async function requireExamAccess(examId: string) {
  await requireAuth();
  await assertAllowedHoi4ExamId(examId);
}

export async function startHoi4ExamAction(
  examId: string,
): Promise<ActionResult<Hoi4ExamRuntimeState>> {
  try {
    await requireExamAccess(examId);
    const state = await setHoi4ExamStarted(examId);
    return okState(state);
  } catch (error) {
    return {
      success: false,
      error: formatExamActionError(error, '출발 처리에 실패했습니다.'),
    };
  }
}

export async function endHoi4ExamAction(
  examId: string,
): Promise<ActionResult<Hoi4ExamRuntimeState>> {
  try {
    await requireExamAccess(examId);
    const state = await setHoi4ExamEnded(examId);
    return okState(state);
  } catch (error) {
    return {
      success: false,
      error: formatExamActionError(error, '종료 처리에 실패했습니다.'),
    };
  }
}

export async function resetHoi4ExamAction(
  examId: string,
): Promise<ActionResult<Hoi4ExamRuntimeState>> {
  try {
    await requireExamAccess(examId);
    const state = await resetHoi4ExamRuntime(examId);
    return okState(state);
  } catch (error) {
    return {
      success: false,
      error: formatExamActionError(error, '초기화에 실패했습니다.'),
    };
  }
}

function formatExamActionError(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    if (/Hoi4ExamState|does not exist|relation/i.test(error.message)) {
      return '호이고사 상태 테이블이 없습니다. `npm run db:ensure-hoi4-exam-state` 실행이 필요합니다.';
    }
    if (/Hoi4ExamEntry/i.test(error.message)) {
      return '호이고사 기록 테이블이 없습니다. `npm run db:ensure-hoi4-exam-entry` 실행이 필요합니다.';
    }
    return error.message;
  }
  return fallback;
}

export async function upsertHoi4ExamEntryAction(
  examId: string,
  input: UpsertHoi4ExamEntryInput,
): Promise<ActionResult<Hoi4GermanExamEntry[]>> {
  try {
    await requireExamAccess(examId);
    await upsertHoi4ExamEntry(examId, input);
    const entries = await getHoi4ExamEntries(examId);
    return okEntries(entries);
  } catch (error) {
    return {
      success: false,
      error: formatExamActionError(error, '기록 저장에 실패했습니다.'),
    };
  }
}

export async function deleteHoi4ExamEntryAction(
  examId: string,
  streamerId: string,
): Promise<ActionResult<Hoi4GermanExamEntry[]>> {
  try {
    await requireExamAccess(examId);
    await deleteHoi4ExamEntry(examId, streamerId);
    const entries = await getHoi4ExamEntries(examId);
    return okEntries(entries);
  } catch (error) {
    return {
      success: false,
      error: formatExamActionError(error, '기록 삭제에 실패했습니다.'),
    };
  }
}

export async function fetchHoi4ExamRuntimeAction(
  examId: string,
): Promise<Hoi4ExamRuntimeState> {
  await assertAllowedHoi4ExamId(examId);
  return getHoi4ExamRuntimeState(examId);
}

export type AdjustHoi4ExamTimeInput = {
  startOffsetSeconds?: number;
  endOffsetSeconds?: number;
  manualStartedAtKst?: string;
  manualEndedAtKst?: string;
};

export async function adjustHoi4ExamTimeAction(
  examId: string,
  input: AdjustHoi4ExamTimeInput,
): Promise<ActionResult<Hoi4ExamRuntimeState>> {
  try {
    await requireExamAccess(examId);

    const patch: Parameters<typeof adjustHoi4ExamRuntimeTimes>[1] = {};

    if (input.startOffsetSeconds != null) {
      patch.startOffsetSeconds = input.startOffsetSeconds;
    }
    if (input.endOffsetSeconds != null) {
      patch.endOffsetSeconds = input.endOffsetSeconds;
    }
    if (input.manualStartedAtKst?.trim()) {
      patch.manualStartedAt = kstDatetimeLocalToIso(input.manualStartedAtKst.trim());
    }
    if (input.manualEndedAtKst?.trim()) {
      patch.manualEndedAt = kstDatetimeLocalToIso(input.manualEndedAtKst.trim());
    }

    if (
      patch.startOffsetSeconds == null &&
      patch.endOffsetSeconds == null &&
      !patch.manualStartedAt &&
      !patch.manualEndedAt
    ) {
      return { success: false, error: '보정할 항목이 없습니다.' };
    }

    const state = await adjustHoi4ExamRuntimeTimes(examId, patch);
    return okState(state);
  } catch (error) {
    return {
      success: false,
      error: formatExamActionError(error, '시간 보정에 실패했습니다.'),
    };
  }
}
