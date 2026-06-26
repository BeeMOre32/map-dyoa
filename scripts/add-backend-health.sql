-- 백엔드 헬스 체크 샘플·일별 집계

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BackendHealthDayStatus') THEN
    CREATE TYPE "BackendHealthDayStatus" AS ENUM ('OK', 'DEGRADED', 'DOWN');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "BackendHealthCheck" (
  "id"         TEXT NOT NULL,
  "checkedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ok"         BOOLEAN NOT NULL,
  "statusCode" INTEGER,
  "latencyMs"  INTEGER,
  "error"      TEXT,
  CONSTRAINT "BackendHealthCheck_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BackendHealthCheck_checkedAt_idx"
  ON "BackendHealthCheck" ("checkedAt");

CREATE TABLE IF NOT EXISTS "BackendHealthDay" (
  "dateKst"      TEXT NOT NULL,
  "totalChecks"  INTEGER NOT NULL,
  "okChecks"     INTEGER NOT NULL,
  "avgLatencyMs" INTEGER,
  "maxLatencyMs" INTEGER,
  "status"       "BackendHealthDayStatus" NOT NULL,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BackendHealthDay_pkey" PRIMARY KEY ("dateKst")
);

CREATE INDEX IF NOT EXISTS "BackendHealthDay_dateKst_idx"
  ON "BackendHealthDay" ("dateKst" DESC);
