import type { Metadata } from 'next';

import { buildPageMetadata } from '@/lib/site';

export const metadata: Metadata = buildPageMetadata({
  title: '공지사항',
  description: '지도동 Map-Dyoa 서비스 공지와 업데이트 소식입니다.',
  path: '/announcements',
});

export default function AnnouncementsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
