export type AnnouncementType = 'info' | 'warning' | 'urgent';

/** 토스트 강조색 (type과 별개로 시각 톤만 지정) */
export type AnnouncementAccent = 'indigo' | 'teal' | 'amber' | 'rose';

export interface Announcement {
  id: string;
  title: string;
  content?: string;
  type: AnnouncementType;
  href?: string;
  accent?: AnnouncementAccent;
}

/** 홈·캘린더 등에 띄우는 공지 (한 건만) */
export const announcementToast: Announcement = {
  id: 'update-2026-08-08',
  type: 'info',
  accent: 'indigo',
  title: '라이브 메타 안정화 · 기능별 백엔드 헬스',
  content:
    'live-meta 오류 완화, 서버·DB·일정·멤버·클립 30분 헬스 체크와 14일 기능별 히트맵을 반영했습니다.',
  href: '/announcements#update-2026-08-08',
};

/** 중앙 팝업으로 띄울 공지. null이면 팝업 없이 토스트만 사용 */
export const announcementPopup: Announcement | null = null;
