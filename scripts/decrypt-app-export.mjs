/**
 * app-data *.enc 복호화 → stdout 또는 파일
 *
 * 실행:
 *   npm run db:decrypt-export -- backups/app-data-....enc
 *   npm run db:decrypt-export -- backups/app-data-....enc --out backups/app-data.json
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  decryptBackupEnvelope,
  isEncryptedBackupEnvelope,
} from './lib/backup-crypto.mjs';
import { loadProjectEnv } from './lib/load-env.mjs';

loadProjectEnv();

const args = process.argv.slice(2).filter((a) => a !== '--');
const outIdx = args.indexOf('--out');
const outPath = outIdx >= 0 ? args[outIdx + 1] : null;
const inputPath = args.find((a) => a !== '--out' && !a.startsWith('-'));

if (!inputPath) {
  console.error('Usage: npm run db:decrypt-export -- <path-to.enc> [--out file.json]');
  process.exit(1);
}

const raw = await readFile(path.resolve(inputPath), 'utf8');
const parsed = JSON.parse(raw);

if (!isEncryptedBackupEnvelope(parsed)) {
  console.error('암호화된 app-data 백업 형식이 아닙니다.');
  process.exit(1);
}

const plaintext = decryptBackupEnvelope(parsed);

if (outPath) {
  await writeFile(path.resolve(outPath), plaintext, 'utf8');
  console.log(`Wrote → ${outPath}`);
} else {
  process.stdout.write(plaintext);
}
