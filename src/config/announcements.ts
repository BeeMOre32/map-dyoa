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
    id: 'health-2026-05',
    type: 'info',
    title: '백엔드 상태 체크 페이지 오픈',
    content: '서버 상태와 응답 지연을 /health 에서 바로 확인할 수 있어요.',
    href: '/health',
  },
  {
    id: 'backend-split-2026-05',
    type: 'info',
    title: '백엔드 분리 프로젝트 1차 진행',
    content: 'Bun · Elysia · Drizzle 기반 신규 서버 초기 구성을 완료했습니다.',
    href: '/announcements#backend-split-2026-05',
  },
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
