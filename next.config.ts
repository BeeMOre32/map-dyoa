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
};

export default withAxiom(nextConfig);
