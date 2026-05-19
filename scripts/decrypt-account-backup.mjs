/**
 * .enc 백업 복호화 → .json (또는 --stdout)
 * 실행: npm run db:decrypt-account -- backups/account-xxx.enc
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  decryptBackupEnvelope,
  isEncryptedBackupEnvelope,
} from './lib/backup-crypto.mjs';
import { loadProjectEnv } from './lib/load-env.mjs';

loadProjectEnv();

const args = process.argv.slice(2);
const toStdout = args.includes('--stdout');
const files = args.filter((a) => !a.startsWith('--'));

if (files.length === 0) {
  console.error('사용법: npm run db:decrypt-account -- backups/account-xxx.enc');
  process.exit(1);
}

for (const file of files) {
  const abs = path.resolve(process.cwd(), file);
  const raw = await readFile(abs, 'utf8');
  const parsed = JSON.parse(raw);

  let plaintext;
  if (isEncryptedBackupEnvelope(parsed)) {
    plaintext = decryptBackupEnvelope(parsed);
  } else if (parsed?.rows && parsed?.table === 'Account') {
    console.warn(`${file}: 이미 평문 JSON — 그대로 출력`);
    plaintext = raw;
  } else {
    throw new Error(`${file}: 알 수 없는 백업 형식`);
  }

  if (toStdout) {
    process.stdout.write(plaintext);
    continue;
  }

  const out =
    abs.endsWith('.enc') ? abs.replace(/\.enc$/i, '.json') : `${abs}.decrypted.json`;
  await writeFile(out, plaintext, 'utf8');
  console.log(`복호화 → ${out}`);
}
