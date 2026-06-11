import { getPrisma } from '@/lib/prisma';

export type Hoi4ExamRuntimeState = {
  manualStartedAt: string | null;
  manualEndedAt: string | null;
};

type ExamStateRow = {
  manualStartedAt: Date | null;
  manualEndedAt: Date | null;
};

const EMPTY_STATE: Hoi4ExamRuntimeState = {
  manualStartedAt: null,
  manualEndedAt: null,
};

function toRuntimeState(row: ExamStateRow | null | undefined): Hoi4ExamRuntimeState {
  if (!row) return EMPTY_STATE;
  return {
    manualStartedAt: row.manualStartedAt?.toISOString() ?? null,
    manualEndedAt: row.manualEndedAt?.toISOString() ?? null,
  };
}

async function findExamStateRow(examId: string): Promise<ExamStateRow | null> {
  const rows = await getPrisma().$queryRaw<ExamStateRow[]>`
    SELECT "manualStartedAt", "manualEndedAt"
    FROM "Hoi4ExamState"
    WHERE "examId" = ${examId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getHoi4ExamRuntimeState(
  examId: string,
): Promise<Hoi4ExamRuntimeState> {
  try {
    return toRuntimeState(await findExamStateRow(examId));
  } catch {
    return EMPTY_STATE;
  }
}

export async function setHoi4ExamStarted(examId: string): Promise<Hoi4ExamRuntimeState> {
  const now = new Date();
  const rows = await getPrisma().$queryRaw<ExamStateRow[]>`
    INSERT INTO "Hoi4ExamState" ("examId", "manualStartedAt", "manualEndedAt", "updatedAt")
    VALUES (${examId}, ${now}, NULL, ${now})
    ON CONFLICT ("examId") DO UPDATE SET
      "manualStartedAt" = EXCLUDED."manualStartedAt",
      "manualEndedAt" = NULL,
      "updatedAt" = EXCLUDED."updatedAt"
    RETURNING "manualStartedAt", "manualEndedAt"
  `;
  return toRuntimeState(rows[0]);
}

export async function setHoi4ExamEnded(examId: string): Promise<Hoi4ExamRuntimeState> {
  const now = new Date();
  const existing = await findExamStateRow(examId);
  const startedAt = existing?.manualStartedAt ?? now;

  const rows = await getPrisma().$queryRaw<ExamStateRow[]>`
    INSERT INTO "Hoi4ExamState" ("examId", "manualStartedAt", "manualEndedAt", "updatedAt")
    VALUES (${examId}, ${startedAt}, ${now}, ${now})
    ON CONFLICT ("examId") DO UPDATE SET
      "manualEndedAt" = EXCLUDED."manualEndedAt",
      "updatedAt" = EXCLUDED."updatedAt"
    RETURNING "manualStartedAt", "manualEndedAt"
  `;
  return toRuntimeState(rows[0]);
}

export async function resetHoi4ExamRuntime(examId: string): Promise<Hoi4ExamRuntimeState> {
  await getPrisma().$executeRaw`
    DELETE FROM "Hoi4ExamState" WHERE "examId" = ${examId}
  `;
  return EMPTY_STATE;
}

export type AdjustHoi4ExamRuntimeInput = {
  /** 출발 시각에 더할 초 (음수 가능) */
  startOffsetSeconds?: number;
  /** 종료 시각에 더할 초 (음수 가능) */
  endOffsetSeconds?: number;
  /** 출발 시각 절대값 (ISO) */
  manualStartedAt?: string;
  /** 종료 시각 절대값 (ISO), null이면 종료 해제 */
  manualEndedAt?: string | null;
};

export async function adjustHoi4ExamRuntimeTimes(
  examId: string,
  input: AdjustHoi4ExamRuntimeInput,
): Promise<Hoi4ExamRuntimeState> {
  const existing = await findExamStateRow(examId);
  if (!existing?.manualStartedAt) {
    throw new Error('출발 기록이 없어 시간을 보정할 수 없습니다.');
  }

  let startedAt = new Date(existing.manualStartedAt);
  let endedAt = existing.manualEndedAt ? new Date(existing.manualEndedAt) : null;

  if (input.startOffsetSeconds != null) {
    startedAt = new Date(startedAt.getTime() + input.startOffsetSeconds * 1000);
  }
  if (input.manualStartedAt) {
    startedAt = new Date(input.manualStartedAt);
    if (!Number.isFinite(startedAt.getTime())) {
      throw new Error('출발 시각이 올바르지 않습니다.');
    }
  }

  if (endedAt && input.endOffsetSeconds != null) {
    endedAt = new Date(endedAt.getTime() + input.endOffsetSeconds * 1000);
  }
  if (input.manualEndedAt !== undefined) {
    endedAt = input.manualEndedAt ? new Date(input.manualEndedAt) : null;
    if (endedAt && !Number.isFinite(endedAt.getTime())) {
      throw new Error('종료 시각이 올바르지 않습니다.');
    }
  }

  if (endedAt && startedAt >= endedAt) {
    throw new Error('출발 시각은 종료 시각보다 이전이어야 합니다.');
  }

  const now = new Date();
  const rows = await getPrisma().$queryRaw<ExamStateRow[]>`
    INSERT INTO "Hoi4ExamState" ("examId", "manualStartedAt", "manualEndedAt", "updatedAt")
    VALUES (${examId}, ${startedAt}, ${endedAt}, ${now})
    ON CONFLICT ("examId") DO UPDATE SET
      "manualStartedAt" = EXCLUDED."manualStartedAt",
      "manualEndedAt" = EXCLUDED."manualEndedAt",
      "updatedAt" = EXCLUDED."updatedAt"
    RETURNING "manualStartedAt", "manualEndedAt"
  `;
  return toRuntimeState(rows[0]);
}
