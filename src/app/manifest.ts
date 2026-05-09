import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Map-Dyoa',
    short_name: 'Map-Dyoa',
    description: '지도동 멤버들의 방송 일정을 한눈에 확인하세요.',
    start_url: '/',
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
