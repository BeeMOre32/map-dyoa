'use client';

import { LayoutGroup } from 'motion/react';

/** 멤버 목록·상세 모달 shared layout (아바타 layoutId) */
export default function StreamersLayoutShell({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <LayoutGroup id="streamers">
      <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain">
        {children}
        {modal}
      </div>
    </LayoutGroup>
  );
}
