-- Supabase SQL Editor 또는 psql에서 실행 (db:push 사용 금지)
ALTER TABLE "Streamer" ADD COLUMN IF NOT EXISTS "youtubeUrl" TEXT;
