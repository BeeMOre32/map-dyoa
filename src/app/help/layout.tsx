import { buildPageMetadata } from '@/lib/site';

export const metadata = buildPageMetadata({
  title: '도움말',
  description:
    '지도동 Map-Dyoa 캘린더·멤버·클립·멀티뷰 사용 방법을 안내합니다.',
  path: '/help',
});

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
