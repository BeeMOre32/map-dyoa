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
  id: 'update-2026-10',
  type: 'info',
  accent: 'amber',
  title: '캘린더 v3 베타 · 방송 자동 등록',
  content: '주간 캘린더에 지금 방송과 자동 일정을 짧게 표시합니다.',
  href: '/announcements#update-2026-10',
};

/** 중앙 팝업으로 띄울 공지. null이면 팝업 없이 토스트만 사용 */
export const announcementPopup: Announcement | null = null;
