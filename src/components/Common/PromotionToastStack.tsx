import { getActiveSiteNotice } from '@/lib/data-fetching';
import PromotionToastStackClient from './PromotionToastStackClient';
import SiteNoticePopup from './SiteNoticePopup';
import type { SiteNoticeView } from './site-notice-shared';

/**
 * 우하단 토스트 스택 + 사이트 공지 분기.
 * - 긴급(URGENT) 공지 → 중앙 팝업 모달
 * - 주의/정보(WARNING·INFO) 공지 → 토스트 스택에 합류
 * 공지는 항상 살아있는 Prisma DB에서 조회하므로 도메인 서버 장애 시에도 노출된다.
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

  return (
    <>
      {view && isUrgent && <SiteNoticePopup notice={view} />}
      <PromotionToastStackClient siteNotice={view && !isUrgent ? view : null} />
    </>
  );
}
