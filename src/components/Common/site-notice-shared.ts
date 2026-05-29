/** 사이트 공지 클라이언트 표시용 공유 타입/상수 */

export const SITE_NOTICE_DISMISS_KEY = 'dismissedSiteNotices';

export type SiteNoticeView = {
  level: 'INFO' | 'WARNING' | 'URGENT';
  title: string;
  body: string | null;
  /** 같은 공지라도 수정되면 다시 노출되도록 id+updatedAt 조합 */
  dismissKey: string;
};
