/**
 * User·Account 제외 전 테이블 JSON 추출 (기본 AES-256-GCM .enc)
 *
 * 실행:
 *   npm run db:export-app              # 암호화 → backups/app-data-YYYY-MM-DDTHH-MM-SS.enc
 *   npm run db:export-app -- --plain   # 평문 JSON (로컬 확인용, git·공유 금지)
 *
 * 제외: User, Account (및 DB에 있으면 Account_backup)
 * 포함: Streamer, Schedule, Game, Clip, Feedback, Session, Push*, AuditLog 등
 *
 * 복호화: npm run db:decrypt-export -- backups/app-data-....enc
 */
import { PrismaClient } from '@prisma/client';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { encryptBackupPayload } from './lib/backup-crypto.mjs';
import { loadProjectEnv } from './lib/load-env.mjs';

loadProjectEnv();

const prisma = new PrismaClient();
const plain = process.argv.includes('--plain');

/** @type {Array<{ table: string; fetch: () => Promise<unknown[]> }>} */
const TABLES = [
  {
    table: 'Game',
    fetch: () => prisma.game.findMany({ orderBy: { title: 'asc' } }),
  },
  {
    table: 'Streamer',
    fetch: () => prisma.streamer.findMany({ orderBy: { name: 'asc' } }),
  },
  {
    table: 'Schedule',
    fetch: () => prisma.schedule.findMany({ orderBy: { startTime: 'asc' } }),
  },
  {
    table: 'ScheduleParticipant',
    fetch: () =>
      prisma.scheduleParticipant.findMany({
        orderBy: [{ scheduleId: 'asc' }, { streamerId: 'asc' }],
      }),
  },
  {
    table: 'Clip',
    fetch: () => prisma.clip.findMany({ orderBy: { createdAt: 'asc' } }),
  },
  {
    table: 'ClipParticipant',
    fetch: () =>
      prisma.clipParticipant.findMany({
        orderBy: [{ clipId: 'asc' }, { streamerId: 'asc' }],
      }),
  },
  {
    table: 'Feedback',
    fetch: () => prisma.feedback.findMany({ orderBy: { createdAt: 'asc' } }),
  },
  {
    table: 'Session',
    fetch: () => prisma.session.findMany({ orderBy: { expires: 'asc' } }),
  },
  {
    table: 'VerificationToken',
    fetch: () => prisma.verificationToken.findMany(),
  },
  {
    table: 'PushSubscription',
    fetch: () => prisma.pushSubscription.findMany({ orderBy: { createdAt: 'asc' } }),
  },
  {
    table: 'PushReminderLog',
    fetch: () => prisma.pushReminderLog.findMany({ orderBy: { sentAt: 'asc' } }),
  },
  {
    table: 'AuditLog',
    fetch: () => prisma.auditLog.findMany({ orderBy: { createdAt: 'asc' } }),
  },
];

const EXCLUDED_TABLES = ['User', 'Account', 'Account_backup'];

const outDir = path.join(process.cwd(), 'backups');
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const ext = plain ? 'json' : 'enc';
const outFile = path.join(outDir, `app-data-${stamp}.${ext}`);

try {
  const tables = {};
  let totalRows = 0;

  for (const { table, fetch } of TABLES) {
    const rows = await fetch();
    tables[table] = rows;
    totalRows += rows.length;
    console.log(`  ${table}: ${rows.length} row(s)`);
  }

  const payload = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      excludedTables: EXCLUDED_TABLES,
      totalRows,
      tables,
    },
    null,
    2,
  );

  await mkdir(outDir, { recursive: true });

  if (plain) {
    await writeFile(outFile, payload, 'utf8');
    console.log(`\nSaved (plain JSON) → ${outFile}`);
    console.warn('경고: 평문 파일은 git·공유·클라우드 동기화에 올리지 마세요.');
  } else {
    const envelope = encryptBackupPayload(payload);
    await writeFile(outFile, JSON.stringify(envelope, null, 2), 'utf8');
    console.log(`\nSaved (encrypted) → ${outFile}`);
    console.log('복호화: npm run db:decrypt-export -- backups/파일명.enc');
  }

  console.log(`제외: ${EXCLUDED_TABLES.join(', ')}`);
} finally {
  await prisma.$disconnect();
}
