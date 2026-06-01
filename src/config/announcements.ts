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

/** 홈·캘린더 등에 띄우는 공지 토스트 (한 건만) */
export const announcementToast: Announcement = {
  id: 'settlement-2026-05',
  type: 'info',
  accent: 'teal',
  title: '5월 후원 정산 · 기부 내역 공개',
  content:
    '수익금 38,000원, 서버비 33,888원을 정산하고 잔여금은 1만원으로 채워 기부합니다. 자세한 내역은 공지에서 확인해 주세요.',
  href: '/announcements#settlement-2026-05',
};
