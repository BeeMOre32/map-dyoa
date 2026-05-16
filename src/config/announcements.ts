export type AnnouncementType = 'info' | 'warning' | 'urgent';

export interface Announcement {
  id: string;
  title: string;
  content?: string;
  type: AnnouncementType;
  href?: string;
}

/** 홈·캘린더 등에 띄우는 공지 토스트 (한 건만) */
export const announcementToast: Announcement = {
  id: 'api-ui-update-2026-05',
  type: 'info',
  title: 'API 연동 완료 · 새 캘린더 UI 적용',
  content:
    'map-dyoa-server API 전환과 V2 캘린더·일정 모달이 기본으로 적용되었습니다. 자세한 내용은 공지 본문을 확인해 주세요.',
  href: '/announcements#api-ui-update-2026-05',
};
