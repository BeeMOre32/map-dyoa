// src/auth.ts
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { getPrisma } from '@/lib/prisma';
import { createStrippedPrismaAdapter } from '@/lib/auth-adapter';

declare module 'next-auth' {
  interface User {
    role?: string;
  }

  interface Session {
    user: {
      id: string;
      role?: string;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: createStrippedPrismaAdapter(getPrisma()),
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      /** 이메일·이름·사진만 제외. id(sub)는 Account 연결용으로만 사용 */
      profile(profile) {
        return {
          id: profile.sub,
          email: '',
          emailVerified: null,
          name: null,
          image: null,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      return {
        ...session,
        user: {
          id: user.id,
          role: user.role,
        },
      };
    },
  },
  events: {
    /** Account 행에 OAuth 토큰이 남지 않도록 로그인마다 정리 */
    async signIn({ user, account }) {
      if (!account) return;
      await getPrisma().account.updateMany({
        where: { userId: user.id!, provider: account.provider },
        data: {
          refresh_token: null,
          access_token: null,
          id_token: null,
          expires_at: null,
          token_type: null,
          scope: null,
          session_state: null,
        },
      });
    },
  },
});
