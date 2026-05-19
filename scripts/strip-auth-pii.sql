-- User 프로필 PII·감사 로그 이메일 제거
-- 순서: 1) npm run db:backup-account (또는 db:export-account)  2) npm run db:strip-auth-pii  3) npx prisma db push
-- Account 행은 삭제하지 않음. OAuth 토큰 컬럼만 NULL 처리.

UPDATE "User" SET email = NULL, name = NULL, image = NULL, "emailVerified" = NULL
WHERE email IS NOT NULL OR name IS NOT NULL OR image IS NOT NULL OR "emailVerified" IS NOT NULL;

ALTER TABLE "User" DROP COLUMN IF EXISTS "email";
ALTER TABLE "User" DROP COLUMN IF EXISTS "name";
ALTER TABLE "User" DROP COLUMN IF EXISTS "image";
ALTER TABLE "User" DROP COLUMN IF EXISTS "emailVerified";

ALTER TABLE "AuditLog" DROP COLUMN IF EXISTS "actorEmail";

UPDATE "Account" SET
  refresh_token = NULL,
  access_token = NULL,
  id_token = NULL,
  expires_at = NULL,
  token_type = NULL,
  scope = NULL,
  session_state = NULL
WHERE refresh_token IS NOT NULL
   OR access_token IS NOT NULL
   OR id_token IS NOT NULL;
