// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const url = new URL(process.env.DATABASE_URL!);
  url.searchParams.set('connection_limit', '3');
  url.searchParams.set('pool_timeout', '30');
  url.searchParams.set('pgbouncer', 'true');
  // Supabase 세션 풀러(5432) → 트랜잭션 풀러(6543) 자동 전환
  if (url.hostname.endsWith('.pooler.supabase.com') && url.port === '5432') {
    url.port = '6543';
  }

  return new PrismaClient({
    datasources: { db: { url: url.toString() } },
    log: ['query', 'error', 'warn'], // 🔥 항상 로그 켜기 - 모든 환경에서 쿼리 확인
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// warm 인스턴스에서 클라이언트 재사용 (프로덕션 포함)
globalForPrisma.prisma = prisma;
