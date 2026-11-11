import { getActiveSiteNotice } from '@/lib/data-fetching';
import { announcementPopup } from '@/config/announcements';
import AnnouncementPopup from './AnnouncementPopup';
import PromotionToastStackClient from './PromotionToastStackClient';
import SiteNoticePopup from './SiteNoticePopup';
import type { SiteNoticeView } from './site-notice-shared';

/**
 * 우하단 토스트 스택 + 사이트 공지 분기.
 * - config `announcementPopup` → 코드로 즉시 띄우는 중앙 팝업 (DB 불필요)
 * - DB 긴급(URGENT) SiteNotice → 중앙 팝업 모달
 * - DB 주의/정보(WARNING·INFO) → 토스트 스택에 합류
 * SiteNotice는 Next Prisma(Auth용 DB)에서 조회하므로 도메인 서버 장애 시에도 노출될 수 있다.
 */
export default async function PromotionToastStack() {
  let view: SiteNoticeView | null = null;
  try {
    const notice = await getActiveSiteNotice();
    if (notice) {
      view = {
        level: notice.level,
        title: notice.title,
        body: notice.body,
        dismissKey: `${notice.id}:${new Date(notice.updatedAt).getTime()}`,
      };
    }
  } catch {
    // 공지 테이블 미생성 등으로 조회 실패해도 사이트는 정상 동작해야 함
    view = null;
  }

  const isUrgent = view?.level === 'URGENT';
  // 정적 긴급 팝업이 켜져 있으면 DB 긴급 팝업과 겹치지 않게 한쪽만 노출
  const showSiteUrgentPopup = Boolean(view && isUrgent && !announcementPopup);

  return (
    <>
      <AnnouncementPopup />
      {view && showSiteUrgentPopup && <SiteNoticePopup notice={view} />}
      <PromotionToastStackClient
        siteNotice={view && !isUrgent ? view : null}
        suppressHelp={Boolean(announcementPopup) || showSiteUrgentPopup}
      />
    </>
  );
}
