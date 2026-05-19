import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const VERSION = 1;
const SALT = 'map-dyoa-account-backup-v1';
const ALGO = 'aes-256-gcm';

export function getBackupSecret() {
  const secret =
    process.env.BACKUP_ENCRYPTION_KEY?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim();
  if (!secret) {
    throw new Error(
      'BACKUP_ENCRYPTION_KEY(권장) 또는 AUTH_SECRET / NEXTAUTH_SECRET 이 .env 에 필요합니다.',
    );
  }
  return secret;
}

function deriveKey(secret) {
  return scryptSync(secret, SALT, 32);
}

/** 평문 → 암호화 envelope (JSON 직렬화용) */
export function encryptBackupPayload(plaintextUtf8, secret = getBackupSecret()) {
  const key = deriveKey(secret);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintextUtf8, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    v: VERSION,
    alg: ALGO,
    enc: 'base64',
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted.toString('base64'),
  };
}

/** envelope → 평문 UTF-8 */
export function decryptBackupEnvelope(envelope, secret = getBackupSecret()) {
  if (envelope?.v !== VERSION || envelope?.alg !== ALGO) {
    throw new Error('지원하지 않는 백업 형식입니다.');
  }
  const key = deriveKey(secret);
  const iv = Buffer.from(envelope.iv, 'base64');
  const tag = Buffer.from(envelope.tag, 'base64');
  const data = Buffer.from(envelope.data, 'base64');
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

export function isEncryptedBackupEnvelope(parsed) {
  return (
    parsed &&
    typeof parsed === 'object' &&
    parsed.v === VERSION &&
    parsed.alg === ALGO &&
    typeof parsed.data === 'string'
  );
}
