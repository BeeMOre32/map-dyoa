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
  id: 'update-2026-08',
  type: 'info',
  accent: 'indigo',
  title: 'LIVE·클립 미리보기 · 확장 1.3.0',
  content:
    'LIVE·클립 호버 미리보기를 추가했습니다. 소리는 「소리 켜기」 후 화면을 한 번 클릭하면 납니다. 확장 1.3.0으로 업데이트해 주세요.',
  href: '/announcements#update-2026-08',
};

/** 중앙 팝업으로 띄울 공지. null이면 팝업 없이 토스트만 사용 */
export const announcementPopup: Announcement | null = null;
