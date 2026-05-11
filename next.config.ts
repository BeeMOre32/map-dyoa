import type { NextConfig } from 'next';
import { withAxiom } from 'next-axiom';

const nextConfig: NextConfig = {
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
