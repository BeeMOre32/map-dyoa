// src/app/page.tsx
import { redirect } from 'next/navigation';
import { buildPageMetadata } from '@/lib/site';

export const metadata = buildPageMetadata({
  title: '지도동 방송 일정',
  description:
    '지도동 멤버의 치지직·유튜브 방송·게임 일정을 캘린더로 확인하세요.',
  path: '/calendar',
});

export default function RootPage() {
  redirect('/calendar');
}
