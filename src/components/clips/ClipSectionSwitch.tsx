'use client';

import { Tabs } from '@heroui/react';
import { usePathname, useRouter } from 'next/navigation';
import { useClipWeeklyBeta } from '@/hooks/useClipWeeklyBeta';

export default function ClipSectionSwitch() {
  const pathname = usePathname();
  const router = useRouter();
  const current = pathname.startsWith('/clips/week') ? 'week' : 'all';
  const [enabled] = useClipWeeklyBeta();
  if (!enabled) return null;

  return (
    <Tabs
      className="w-full"
      selectedKey={current}
      onSelectionChange={(key) => {
        const next = String(key) === 'week' ? '/clips/week' : '/clips';
        if (pathname !== next) router.push(next);
      }}
    >
      <Tabs.ListContainer>
        <Tabs.List aria-label="클립 구분">
          <Tabs.Tab id="all">
            전체 클립
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="week">
            주간 추천
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
    </Tabs>
  );
}
