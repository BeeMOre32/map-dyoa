import { buildPageMetadata } from '@/lib/site';

export const metadata = buildPageMetadata({
  title: '백엔드 상태',
  description:
    'map-dyoa-server API 실시간 응답·Cron 자동 수집·최근 30일 가동 히트맵을 확인합니다.',
  path: '/health',
});

export default function HealthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
