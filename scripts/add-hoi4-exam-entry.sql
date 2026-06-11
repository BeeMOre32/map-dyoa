-- HOI4 호이고사 멤버별 클리어 기록 (Prisma Hoi4ExamEntry)

CREATE TABLE IF NOT EXISTS "Hoi4ExamEntry" (
  "examId"        TEXT NOT NULL,
  "streamerId"    TEXT NOT NULL,
  "clearGameDate" TEXT,
  "playTimeMs"    INTEGER,
  "clearedAtKst"  TEXT,
  "vodUrl"        TEXT,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Hoi4ExamEntry_pkey" PRIMARY KEY ("examId", "streamerId")
);

CREATE INDEX IF NOT EXISTS "Hoi4ExamEntry_examId_idx" ON "Hoi4ExamEntry" ("examId");
