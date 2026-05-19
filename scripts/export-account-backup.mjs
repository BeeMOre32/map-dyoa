/**
 * Account → AES-256-GCM 암호화 백업 (.enc)
 * 실행: npm run db:export-account
 */
import { PrismaClient } from '@prisma/client';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { encryptBackupPayload } from './lib/backup-crypto.mjs';
import { loadProjectEnv } from './lib/load-env.mjs';

loadProjectEnv();

const prisma = new PrismaClient();

const outDir = path.join(process.cwd(), 'backups');
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outFile = path.join(outDir, `account-${stamp}.enc`);

try {
  const rows = await prisma.account.findMany({
    orderBy: [{ provider: 'asc' }, { providerAccountId: 'asc' }],
  });

  const payload = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      table: 'Account',
      rowCount: rows.length,
      rows,
    },
    null,
    0,
  );

  const envelope = encryptBackupPayload(payload);
  await mkdir(outDir, { recursive: true });
  await writeFile(outFile, JSON.stringify(envelope, null, 2), 'utf8');

  console.log(`Saved ${rows.length} row(s) → ${outFile}`);
  console.log('암호화됨 — BACKUP_ENCRYPTION_KEY 또는 AUTH_SECRET 으로만 복호화 가능');
  console.log('복호화: npm run db:decrypt-account -- backups/파일명.enc');
} finally {
  await prisma.$disconnect();
}
