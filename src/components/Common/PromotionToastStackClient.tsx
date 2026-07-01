'use client';

import AnnouncementToast from './AnnouncementToast';
import AnnouncementPopup from './AnnouncementPopup';
import HelpToast from './HelpToast';
import SiteNoticeToast from './SiteNoticeToast';
import type { SiteNoticeView } from './site-notice-shared';

export default function PromotionToastStackClient({
  siteNotice,
}: {
  siteNotice: SiteNoticeView | null;
}) {
  return (
    <>
      <AnnouncementPopup />
      <div className="pointer-events-none fixed bottom-4 right-4 z-[280] flex w-[min(320px,calc(100vw-2rem))] flex-col-reverse items-end gap-2">
      {siteNotice && <SiteNoticeToast notice={siteNotice} stacked />}
      <AnnouncementToast stacked />
      <HelpToast stacked />
      </div>
    </>
  );
}
