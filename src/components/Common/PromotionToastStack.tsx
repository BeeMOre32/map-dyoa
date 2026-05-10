'use client';

import AnnouncementToast from './AnnouncementToast';
import HelpToast from './HelpToast';

export default function PromotionToastStack() {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[280] flex w-[min(320px,calc(100vw-2rem))] flex-col-reverse items-end gap-2">
      <AnnouncementToast stacked />
      <HelpToast stacked />
    </div>
  );
}
