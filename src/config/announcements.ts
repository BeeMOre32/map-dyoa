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
  id: 'backend-db-error-2026-05-29',
  type: 'urgent',
  title: '일부 기능 접속 오류 안내',
  content:
    '현재 백엔드 DB 연결 문제로 멤버·일정 조회가 지연되거나 실패할 수 있습니다. 복구 확인 후 다시 안내드리겠습니다.',
};
