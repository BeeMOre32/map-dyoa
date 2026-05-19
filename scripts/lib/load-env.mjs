import { config } from 'dotenv';
import { resolve } from 'path';

/** Prisma CLI와 동일하게 .env / .env.local 로드 */
export function loadProjectEnv() {
  config({ path: resolve(process.cwd(), '.env') });
  config({ path: resolve(process.cwd(), '.env.local') });
}
