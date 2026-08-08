-- 백엔드 헬스: feature 컬럼 · Day 복합키

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BackendHealthDayStatus') THEN
    CREATE TYPE "BackendHealthDayStatus" AS ENUM ('OK', 'DEGRADED', 'DOWN');
  END IF;
END
$$;

-- Sample 테이블
CREATE TABLE IF NOT EXISTS "BackendHealthCheck" (
  "id"         TEXT NOT NULL,
  "feature"    TEXT NOT NULL DEFAULT 'live',
  "checkedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ok"         BOOLEAN NOT NULL,
  "statusCode" INTEGER,
  "latencyMs"  INTEGER,
  "error"      TEXT,
  CONSTRAINT "BackendHealthCheck_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "BackendHealthCheck" ADD COLUMN IF NOT EXISTS "feature" TEXT;
UPDATE "BackendHealthCheck" SET "feature" = 'live' WHERE "feature" IS NULL OR "feature" = '';
ALTER TABLE "BackendHealthCheck" ALTER COLUMN "feature" SET DEFAULT 'live';
ALTER TABLE "BackendHealthCheck" ALTER COLUMN "feature" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "BackendHealthCheck_checkedAt_idx"
  ON "BackendHealthCheck" ("checkedAt");
CREATE INDEX IF NOT EXISTS "BackendHealthCheck_feature_checkedAt_idx"
  ON "BackendHealthCheck" ("feature", "checkedAt");

-- Day: 구 PK(dateKst만) → 복합키로 이관
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'BackendHealthDay'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'BackendHealthDay'
      AND column_name = 'feature'
  ) THEN
    CREATE TABLE "BackendHealthDay_mig" (
      "dateKst"      TEXT NOT NULL,
      "feature"      TEXT NOT NULL DEFAULT 'live',
      "totalChecks"  INTEGER NOT NULL,
      "okChecks"     INTEGER NOT NULL,
      "avgLatencyMs" INTEGER,
      "maxLatencyMs" INTEGER,
      "status"       "BackendHealthDayStatus" NOT NULL,
      "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "BackendHealthDay_pkey" PRIMARY KEY ("dateKst", "feature")
    );

    INSERT INTO "BackendHealthDay_mig" (
      "dateKst", "feature", "totalChecks", "okChecks",
      "avgLatencyMs", "maxLatencyMs", "status", "updatedAt"
    )
    SELECT
      "dateKst", 'live', "totalChecks", "okChecks",
      "avgLatencyMs", "maxLatencyMs", "status", "updatedAt"
    FROM "BackendHealthDay";

    DROP TABLE "BackendHealthDay";
    ALTER TABLE "BackendHealthDay_mig" RENAME TO "BackendHealthDay";
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "BackendHealthDay" (
  "dateKst"      TEXT NOT NULL,
  "feature"      TEXT NOT NULL DEFAULT 'live',
  "totalChecks"  INTEGER NOT NULL,
  "okChecks"     INTEGER NOT NULL,
  "avgLatencyMs" INTEGER,
  "maxLatencyMs" INTEGER,
  "status"       "BackendHealthDayStatus" NOT NULL,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BackendHealthDay_pkey" PRIMARY KEY ("dateKst", "feature")
);

ALTER TABLE "BackendHealthDay" ADD COLUMN IF NOT EXISTS "feature" TEXT;
UPDATE "BackendHealthDay" SET "feature" = 'live' WHERE "feature" IS NULL OR "feature" = '';

CREATE INDEX IF NOT EXISTS "BackendHealthDay_dateKst_idx"
  ON "BackendHealthDay" ("dateKst" DESC);
