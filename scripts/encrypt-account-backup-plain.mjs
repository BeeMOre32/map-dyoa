/**
 * 기존 평문 account-*.json → .enc 로 재암호화 (원본 json 삭제 옵션)
 * 실행: npm run db:encrypt-account-backups
 *       npm run db:encrypt-account-backups -- --delete-plain
 */
import { readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { encryptBackupPayload } from './lib/backup-crypto.mjs';
import { loadProjectEnv } from './lib/load-env.mjs';

loadProjectEnv();

const deletePlain = process.argv.includes('--delete-plain');
const outDir = path.join(process.cwd(), 'backups');

const entries = await readdir(outDir, { withFileTypes: true });
const jsonFiles = entries
  .filter((e) => e.isFile() && /^account-.+\.json$/i.test(e.name))
  .map((e) => e.name);

if (jsonFiles.length === 0) {
  console.log('암호화할 account-*.json 이 backups/ 에 없습니다.');
  process.exit(0);
}

for (const name of jsonFiles) {
  const jsonPath = path.join(outDir, name);
  const encPath = jsonPath.replace(/\.json$/i, '.enc');
  const raw = await readFile(jsonPath, 'utf8');
  JSON.parse(raw);
  const envelope = encryptBackupPayload(raw);
  await writeFile(encPath, JSON.stringify(envelope, null, 2), 'utf8');
  console.log(`${name} → ${path.basename(encPath)}`);
  if (deletePlain) {
    await unlink(jsonPath);
    console.log(`  삭제: ${name}`);
  }
}

console.log('완료');
