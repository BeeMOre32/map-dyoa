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
  id: 'settlement-2026-10',
  type: 'info',
  accent: 'teal',
  title: '10월 후원 정산',
  content: '수익금 10,000원, 서버비 31,243원, 남은 100,187원은 다음 달로 이월합니다.',
  href: '/announcements#settlement-2026-10',
};

/** 중앙 팝업으로 띄울 공지. null이면 팝업 없이 토스트만 사용 */
export const announcementPopup: Announcement | null = null;
