-- Account_backup → Account 복구 (provider+providerAccountId 충돌 시 백업 행으로 덮어씀)
-- 실행: npm run db:restore-account
-- 전제: scripts/backup-account.sql 실행 후 Account_backup 테이블이 있어야 함

-- 백업 테이블 없으면 실패
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Account_backup'
  ) THEN
    RAISE EXCEPTION 'Account_backup 테이블이 없습니다. 먼저 npm run db:backup-account 를 실행하세요.';
  END IF;
END $$;

INSERT INTO "Account" (
  id, "userId", type, provider, "providerAccountId",
  refresh_token, access_token, expires_at, token_type, scope, id_token, session_state
)
SELECT
  id, "userId", type, provider, "providerAccountId",
  refresh_token, access_token, expires_at, token_type, scope, id_token, session_state
FROM "Account_backup"
ON CONFLICT (provider, "providerAccountId") DO UPDATE SET
  "userId" = EXCLUDED."userId",
  type = EXCLUDED.type,
  refresh_token = EXCLUDED.refresh_token,
  access_token = EXCLUDED.access_token,
  expires_at = EXCLUDED.expires_at,
  token_type = EXCLUDED.token_type,
  scope = EXCLUDED.scope,
  id_token = EXCLUDED.id_token,
  session_state = EXCLUDED.session_state;

SELECT COUNT(*)::int AS restored_from_backup FROM "Account_backup";
