'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Tabs } from '@heroui/react';
import { motion } from 'motion/react';
import { Calendar, Users, Clapperboard, Sword, Radio } from 'lucide-react';
import { useLiveStatus } from '@/hooks/useLiveStatus';
import { isBongnudoSeasonActive } from '@/lib/bongnudo';

const tabs = [
  { id: 'calendar', label: '스케줄', href: '/calendar', icon: Calendar },
  { id: 'streamers', label: '멤버·라이브', href: '/streamers', icon: Users },
  { id: 'clips', label: '클립', href: '/clips', icon: Clapperboard },
  { id: 'bongnudo', label: '봉누도', href: '/bongnudo', icon: Radio },
  { id: 'hoi4', label: '전적', href: '/hoi4', icon: Sword },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { liveIds } = useLiveStatus();
  const liveCount = liveIds.size;

  const isModalOpen =
    pathname.includes('/calendar/schedule/') ||
    pathname.includes('/calendar/day/') ||
    pathname.includes('/streamers/detail/') ||
    pathname.includes('/multiview');

  if (isModalOpen) return null;

  const visible = tabs.filter((tab) => tab.id !== 'bongnudo' || isBongnudoSeasonActive());
  const current = visible.find((tab) => pathname.startsWith(tab.href))?.id ?? null;

  return (
    <Tabs
      className="w-max max-w-full"
      selectedKey={current ?? undefined}
      onSelectionChange={(key) => {
        const href = visible.find((tab) => tab.id === String(key))?.href;
        if (!href || pathname.startsWith(href)) return;
        router.push(href);
      }}
    >
      <Tabs.ListContainer className="w-max max-w-full">
        <Tabs.List aria-label="지도동 메뉴" className="!w-max !min-w-0">
          {visible.map((tab) => {
            const live = tab.id === 'streamers' && liveCount > 0;
            return (
              <Tabs.Tab
                key={tab.id}
                id={tab.id}
                className={`!h-auto !w-auto shrink-0 gap-1 !whitespace-nowrap px-2 py-1.5 sm:px-4 ${
                  tab.id === 'hoi4' ? 'data-[selected=true]:text-amber-600' : ''
                } ${live ? 'data-[selected=true]:text-red-600' : ''}`}
              >
                {live && current !== 'streamers' ? (
                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-2xl border border-red-200/70 bg-red-50 dark:border-red-700/50 dark:bg-red-900/20"
                    animate={{ opacity: [0.45, 1, 0.45] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                ) : null}
                <tab.icon className="relative z-10 size-3.5 shrink-0 sm:size-4" />
                <span className="relative z-10 hidden whitespace-nowrap sm:inline">{tab.label}</span>
                {live ? (
                  <span className="relative z-10 inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black leading-none text-white">
                    {liveCount}
                  </span>
                ) : null}
                <Tabs.Indicator />
              </Tabs.Tab>
            );
          })}
        </Tabs.List>
      </Tabs.ListContainer>
    </Tabs>
  );
}
