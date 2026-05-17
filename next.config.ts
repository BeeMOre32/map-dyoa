import type { NextConfig } from 'next';
import { withAxiom } from 'next-axiom';

/** 클라이언트 번들에 프로덕션 origin 주입 (공유 링크·OG) */
function resolvePublicSiteUrl(): string | undefined {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) {
    return production.startsWith('http')
      ? production.replace(/\/$/, '')
      : `https://${production.replace(/\/$/, '')}`;
  }

  return undefined;
}

const publicSiteUrl = resolvePublicSiteUrl();

const nextConfig: NextConfig = {
  ...(publicSiteUrl
    ? { env: { NEXT_PUBLIC_SITE_URL: publicSiteUrl } }
    : {}),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.pstatic.net' },
      { protocol: 'https', hostname: '**.naver.com' },
      { protocol: 'https', hostname: '**.naver.net' },
      { protocol: 'https', hostname: '**.sooplive.co.kr' },
      { protocol: 'https', hostname: '**.afreecatv.com' },
    ],
  },
  /**
   * 브라우저에서 동일 출처로 map-dyoa-server를 부를 때 CORS 없이 쓰기 위한 리라이트.
   * 클라이언트: `fetch('/map-dyoa-api/schedules?...')` → `MAP_DYOA_SERVER_URL/schedules?...`
   * (서버 액션·RSC는 기존처럼 `MAP_DYOA_SERVER_URL` 직접 호출 가능)
   */
  async rewrites() {
    const base = process.env.MAP_DYOA_SERVER_URL?.trim().replace(/\/$/, '');
    if (!base) return [];
    return [{ source: '/map-dyoa-api/:path*', destination: `${base}/:path*` }];
  },
};

export default withAxiom(nextConfig);
