import type { Hoi4GermanExamEntry } from '@/config/hoi4GermanExam2026';
import { parseGameDateKey } from '@/lib/hoi4GermanExam';
import { getPrisma } from '@/lib/prisma';

type EntryRow = {
  streamerId: string;
  clearGameDate: string | null;
  playTimeMs: number | null;
  clearedAtKst: string | null;
  vodUrl: string | null;
};

export type UpsertHoi4ExamEntryInput = {
  streamerId: string;
  clearGameDate: string;
  playHours: number;
  playMinutes: number;
  playSeconds?: number;
  clearedAtKst?: string;
  vodUrl?: string;
};

function rowToEntry(row: EntryRow): Hoi4GermanExamEntry {
  return {
    streamerId: row.streamerId,
    clearGameDate: row.clearGameDate ?? undefined,
    playTimeMs: row.playTimeMs ?? undefined,
    clearedAtKst: row.clearedAtKst ?? undefined,
    vodUrl: row.vodUrl ?? undefined,
  };
}

export function normalizeExamGameDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const key = parseGameDateKey(trimmed);
  if (key == null) return null;
  const date = new Date(key);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function normalizeClearedAtKst(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function playTimeMsFromParts(
  hours: number,
  minutes: number,
  seconds = 0,
): number | null {
  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || !Number.isFinite(seconds)) {
    return null;
  }
  if (hours < 0 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
    return null;
  }
  const total = hours * 3_600_000 + minutes * 60_000 + seconds * 1000;
  return total > 0 ? total : null;
}

export async function getHoi4ExamEntries(examId: string): Promise<Hoi4GermanExamEntry[]> {
  try {
    const rows = await getPrisma().$queryRaw<EntryRow[]>`
      SELECT "streamerId", "clearGameDate", "playTimeMs", "clearedAtKst", "vodUrl"
      FROM "Hoi4ExamEntry"
      WHERE "examId" = ${examId}
      ORDER BY "streamerId" ASC
    `;
    return rows.map(rowToEntry);
  } catch {
    return [];
  }
}

export async function upsertHoi4ExamEntry(
  examId: string,
  input: UpsertHoi4ExamEntryInput,
): Promise<Hoi4GermanExamEntry> {
  const clearGameDate = normalizeExamGameDate(input.clearGameDate);
  if (!clearGameDate) {
    throw new Error('게임 날짜 형식이 올바르지 않습니다. (예: 1941-08-04)');
  }

  const playTimeMs = playTimeMsFromParts(
    input.playHours,
    input.playMinutes,
    input.playSeconds ?? 0,
  );
  if (playTimeMs == null) {
    throw new Error('플레이 시간을 입력해 주세요.');
  }

  const clearedAtKst = normalizeClearedAtKst(input.clearedAtKst);
  if (input.clearedAtKst?.trim() && !clearedAtKst) {
    throw new Error('클리어 시각 형식이 올바르지 않습니다. (예: 21:18)');
  }

  const vodUrl = input.vodUrl?.trim() || null;
  const now = new Date();

  const rows = await getPrisma().$queryRaw<EntryRow[]>`
    INSERT INTO "Hoi4ExamEntry" (
      "examId", "streamerId", "clearGameDate", "playTimeMs", "clearedAtKst", "vodUrl", "updatedAt"
    )
    VALUES (
      ${examId},
      ${input.streamerId},
      ${clearGameDate},
      ${playTimeMs},
      ${clearedAtKst},
      ${vodUrl},
      ${now}
    )
    ON CONFLICT ("examId", "streamerId") DO UPDATE SET
      "clearGameDate" = EXCLUDED."clearGameDate",
      "playTimeMs" = EXCLUDED."playTimeMs",
      "clearedAtKst" = EXCLUDED."clearedAtKst",
      "vodUrl" = EXCLUDED."vodUrl",
      "updatedAt" = EXCLUDED."updatedAt"
    RETURNING "streamerId", "clearGameDate", "playTimeMs", "clearedAtKst", "vodUrl"
  `;

  return rowToEntry(rows[0]);
}

export async function deleteHoi4ExamEntry(
  examId: string,
  streamerId: string,
): Promise<void> {
  await getPrisma().$executeRaw`
    DELETE FROM "Hoi4ExamEntry"
    WHERE "examId" = ${examId} AND "streamerId" = ${streamerId}
  `;
}

export function entryMapFromList(
  entries: readonly Hoi4GermanExamEntry[],
): Map<string, Hoi4GermanExamEntry> {
  return new Map(entries.map((entry) => [entry.streamerId, entry]));
}

export function playTimePartsFromMs(playTimeMs: number | undefined): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  if (playTimeMs == null || !Number.isFinite(playTimeMs) || playTimeMs <= 0) {
    return { hours: 0, minutes: 0, seconds: 0 };
  }
  const totalSeconds = Math.floor(playTimeMs / 1000);
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}
