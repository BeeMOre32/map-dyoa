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
    id: 'donation-2025-05',
    type: 'info',
    title: '서버 후원 시스템 안내',
    content: '사이트 운영 관련 중요 공지가 있습니다.',
    href: '/announcements',
  },
];
