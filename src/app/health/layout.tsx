import { buildPageMetadata } from '@/lib/site';

export const metadata = buildPageMetadata({
  title: '백엔드 상태',
  description:
    'map-dyoa-server 큰 줄기(서버·DB·일정·멤버·클립) 실시간 응답·30분 Cron·14일 기능별 히트맵을 확인합니다.',
  path: '/health',
});

export default function HealthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
