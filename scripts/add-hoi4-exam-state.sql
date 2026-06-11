-- HOI4 호이고사 수동 출발·종료 상태 (Prisma Hoi4ExamState)

CREATE TABLE IF NOT EXISTS "Hoi4ExamState" (
  "examId"          TEXT NOT NULL,
  "manualStartedAt" TIMESTAMP(3),
  "manualEndedAt"   TIMESTAMP(3),
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Hoi4ExamState_pkey" PRIMARY KEY ("examId")
);
