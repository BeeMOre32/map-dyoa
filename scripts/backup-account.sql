-- Account 테이블 스냅샷 (같은 DB에 백업 테이블 생성)
-- 실행: npm run db:backup-account
-- 복구: npm run db:restore-account  (scripts/restore-account-from-backup.sql)
--
-- ※ refresh_token / access_token 등 민감 정보 포함 — git·공유 금지

DROP TABLE IF EXISTS "Account_backup";

CREATE TABLE "Account_backup" (LIKE "Account" INCLUDING ALL);

INSERT INTO "Account_backup"
SELECT * FROM "Account";

-- 확인용 (prisma db execute는 결과만 출력)
SELECT COUNT(*)::int AS backed_up_rows FROM "Account_backup";
