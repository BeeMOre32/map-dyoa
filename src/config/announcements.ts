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
  id: 'settlement-2026-08',
  type: 'info',
  accent: 'teal',
  title: '8월 후원 정산 · 잔여금 이월 안내',
  content:
    '수익금 30,000원, 서버비 33,136원, 잔여금 73,983원은 다음 달로 이월합니다.',
  href: '/announcements#settlement-2026-08',
};

/** 중앙 팝업으로 띄울 공지. null이면 팝업 없이 토스트만 사용 */
export const announcementPopup: Announcement | null = null;
