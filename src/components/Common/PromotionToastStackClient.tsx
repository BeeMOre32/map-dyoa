'use client';

import AnnouncementToast from './AnnouncementToast';
import HelpToast from './HelpToast';
import SiteNoticeToast from './SiteNoticeToast';
import type { SiteNoticeView } from './site-notice-shared';

export default function PromotionToastStackClient({
  siteNotice,
  suppressHelp = false,
}: {
  siteNotice: SiteNoticeView | null;
  /** 정적 중앙 팝업이 떠 있을 때 도움말 토스트를 숨김 */
  suppressHelp?: boolean;
}) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[280] flex w-[min(320px,calc(100vw-2rem))] flex-col-reverse items-end gap-2">
      {siteNotice && <SiteNoticeToast notice={siteNotice} stacked />}
      <AnnouncementToast stacked />
      {!suppressHelp && <HelpToast stacked />}
    </div>
  );
}
