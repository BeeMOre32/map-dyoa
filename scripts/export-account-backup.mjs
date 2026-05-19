/**
 * Account → JSON 파일 백업 (DB 밖 보관용)
 * 실행: npm run db:export-account
 * 필요: DATABASE_URL 또는 DIRECT_URL (.env)
 */
import { PrismaClient } from '@prisma/client';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const prisma = new PrismaClient();

const outDir = path.join(process.cwd(), 'backups');
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outFile = path.join(outDir, `account-${stamp}.json`);

try {
  const rows = await prisma.account.findMany({
    orderBy: [{ provider: 'asc' }, { providerAccountId: 'asc' }],
  });

  await mkdir(outDir, { recursive: true });
  await writeFile(
    outFile,
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        table: 'Account',
        rowCount: rows.length,
        rows,
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log(`Saved ${rows.length} row(s) → ${outFile}`);
  console.log('⚠️  OAuth 토큰 포함 — backups/ 는 .gitignore 대상, 외부 공유 금지');
} finally {
  await prisma.$disconnect();
}
