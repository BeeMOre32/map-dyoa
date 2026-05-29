'use client';

import AnnouncementToast from './AnnouncementToast';
import HelpToast from './HelpToast';
import { announcementToast } from '@/config/announcements';

export default function PromotionToastStack() {
  const showOnlyAnnouncement = announcementToast.type === 'urgent';

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[280] flex w-[min(320px,calc(100vw-2rem))] flex-col-reverse items-end gap-2">
      <AnnouncementToast stacked />
      {!showOnlyAnnouncement && <HelpToast stacked />}
    </div>
  );
}
