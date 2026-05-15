// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { isScheduleServerEnabled } from '@/lib/map-dyoa-server-schedules';
import { assertLocalPrismaDomainAllowed } from '@/lib/backend-mode';

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const rawUrl = process.env.DATABASE_URL?.trim();
  if (!rawUrl) {
    throw new Error(
      'DATABASE_URL이 없습니다. NextAuth·웹푸시 등에 Prisma가 필요합니다.',
    );
  }

  const url = new URL(rawUrl);
  url.searchParams.set('connection_limit', '3');
  url.searchParams.set('pool_timeout', '30');
  url.searchParams.set('pgbouncer', 'true');
  if (url.hostname.endsWith('.pooler.supabase.com') && url.port === '5432') {
    url.port = '6543';
  }

  const log = isScheduleServerEnabled()
    ? (['error', 'warn'] as const)
    : (['query', 'error', 'warn'] as const);

  return new PrismaClient({
    datasources: { db: { url: url.toString() } },
    log: [...log],
  });
}

/** NextAuth·웹푸시 등 map-dyoa-server에 없는 기능 전용 (지연 초기화) */
export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/** @alias getPrisma */
export const getPrismaForAppServices = getPrisma;

/**
 * 일정·스트리머·클립·게임·피드백 등 도메인 데이터.
 * MAP_DYOA_SERVER_URL이 설정되면 호출 시 오류 (로컬 전용).
 */
export function getPrismaForDomain(): PrismaClient {
  assertLocalPrismaDomainAllowed('getPrismaForDomain');
  return getPrisma();
}
