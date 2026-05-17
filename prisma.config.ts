import { config } from 'dotenv';
import { resolve } from 'path';
import { defineConfig } from 'prisma/config';

// Prisma CLI는 .env를 자동 로드하지 않음 → 명시적으로 프로젝트 루트 .env 로드
config({ path: resolve(process.cwd(), '.env') });

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL이 비어 있습니다. .env에 Supabase 연결 문자열을 넣었는지 확인하세요.',
  );
}

const directUrl = process.env.DIRECT_URL?.trim();

export default defineConfig({
  schema: './prisma/schema.prisma',
  engine: 'classic',
  datasource: {
    url: databaseUrl,
    ...(directUrl ? { directUrl } : {}),
  },
});
