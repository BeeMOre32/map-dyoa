export type AnnouncementType = 'info' | 'warning' | 'urgent';

export interface Announcement {
  id: string;
  title: string;
  content?: string;
  type: AnnouncementType;
  href?: string;
}

// 공지사항을 추가/수정하려면 이 배열을 편집하세요.
export const announcements: Announcement[] = [
  {
    id: 'pwa-2026-05',
    type: 'info',
    title: 'PWA · 홈 화면에 추가',
    content: '앱처럼 실행하고, 알림·바로가기를 더 편하게 쓸 수 있어요.',
    href: '/announcements#pwa',
  },
  {
    id: 'donation-2025-05',
    type: 'info',
    title: '서버 후원 시스템 안내',
    content: '사이트 운영 관련 중요 공지가 있습니다.',
    href: '/announcements',
  },
];
