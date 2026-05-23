import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '지도동 방송 일정',
    short_name: '지도동',
    description:
      '지도동 멤버의 치지직·유튜브 합방·게임 방송 일정과 클립을 확인하세요.',
    start_url: '/calendar',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#4f46e5',
    icons: [
      {
        src: '/brand/map-dyoa-logo.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/brand/map-dyoa-logo.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
    ],
  };
}
