import type { Adapter, AdapterUser } from '@auth/core/adapters';
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { PrismaClient } from '@prisma/client';

type DbUser = {
  id: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};

function toAdapterUser(user: DbUser): AdapterUser {
  return {
    id: user.id,
    role: user.role,
    email: '',
    emailVerified: null,
    name: null,
    image: null,
  } as AdapterUser;
}

/**
 * Auth.js Prisma 어댑터 — User에 이메일·이름 등 프로필 PII 미저장.
 * 식별: Account(provider + providerAccountId) ↔ User.id ↔ Session
 */
export function createStrippedPrismaAdapter(prisma: PrismaClient): Adapter {
  const base = PrismaAdapter(prisma) as Adapter;

  return {
    ...base,
    async createUser() {
      const user = await prisma.user.create({
        data: { role: 'USER' },
      });
      return toAdapterUser(user);
    },
    async updateUser({ id }) {
      const user = await prisma.user.update({
        where: { id },
        data: {},
      });
      return toAdapterUser(user);
    },
    async getUserByEmail() {
      return null;
    },
  };
}
