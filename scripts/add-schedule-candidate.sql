-- LIVE 미등록 일정 후보 큐

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ScheduleCandidateStatus') THEN
    CREATE TYPE "ScheduleCandidateStatus" AS ENUM ('PENDING', 'APPROVED', 'DISMISSED');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "ScheduleCandidate" (
  "id"           TEXT NOT NULL,
  "streamerId"   TEXT NOT NULL,
  "streamerName" TEXT NOT NULL,
  "dateKst"      TEXT NOT NULL,
  "status"       "ScheduleCandidateStatus" NOT NULL DEFAULT 'PENDING',
  "title"        TEXT,
  "liveUrl"      TEXT,
  "liveCategory" TEXT,
  "detectedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt"   TIMESTAMP(3),
  "scheduleId"   TEXT,
  "note"         TEXT,
  CONSTRAINT "ScheduleCandidate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ScheduleCandidate_streamerId_dateKst_key"
  ON "ScheduleCandidate" ("streamerId", "dateKst");

CREATE INDEX IF NOT EXISTS "ScheduleCandidate_status_detectedAt_idx"
  ON "ScheduleCandidate" ("status", "detectedAt" DESC);

CREATE INDEX IF NOT EXISTS "ScheduleCandidate_dateKst_idx"
  ON "ScheduleCandidate" ("dateKst");
