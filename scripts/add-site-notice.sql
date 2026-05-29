-- Supabase / Fly Postgres — SiteNotice (긴급 공지/장애 안내 배너)
-- NextAuth 등이 쓰는 항상 살아있는 Prisma DB에 생성한다.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NoticeLevel') THEN
    CREATE TYPE "NoticeLevel" AS ENUM ('INFO', 'WARNING', 'URGENT');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "SiteNotice" (
  "id"        TEXT NOT NULL,
  "level"     "NoticeLevel" NOT NULL DEFAULT 'INFO',
  "title"     TEXT NOT NULL,
  "body"      TEXT,
  "active"    BOOLEAN NOT NULL DEFAULT true,
  "startsAt"  TIMESTAMP(3),
  "endsAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiteNotice_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SiteNotice_active_startsAt_endsAt_idx"
  ON "SiteNotice" ("active", "startsAt", "endsAt");
