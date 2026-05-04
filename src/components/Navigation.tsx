'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Users, Clapperboard, Radio, Sword } from 'lucide-react';

const tabs = [
  { id: 'live', label: '라이브', href: '/live', icon: Radio, isLive: true },
  { id: 'calendar', label: '스케줄', href: '/calendar', icon: Calendar },
  { id: 'streamers', label: '멤버', href: '/streamers', icon: Users },
  { id: 'clips', label: '클립', href: '/clips', icon: Clapperboard },
  { id: 'hoi4', label: '전적', href: '/hoi4', icon: Sword, isHoi4: true },
];

export default function Navigation() {
  const pathname = usePathname();

  const isModalOpen =
    pathname.includes('/calendar/schedule/') ||
    pathname.includes('/calendar/day/') ||
    pathname.includes('/streamers/detail/');

  if (isModalOpen) return null;

  return (
    <nav className="flex justify-center py-0 shrink-0 transition-colors z-30">
      <div className="rounded-xl flex bg-slate-100 dark:bg-slate-900 p-1.5 border-2 border-slate-200 dark:border-slate-800 relative shadow-inner">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const isLive = tab.id === 'live';
          const isHoi4 = tab.id === 'hoi4';

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`relative flex items-center gap-1.5 px-2.5 py-2 sm:px-4 md:px-5 rounded-2xl text-sm font-black transition-all z-10 ${
                isActive
                  ? isLive
                    ? 'text-red-600 dark:text-red-400'
                    : isHoi4
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-indigo-600 dark:text-indigo-400'
                  : isLive
                    ? 'text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300'
                    : isHoi4
                      ? 'text-amber-500 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200/50 dark:border-slate-700"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}

              {/* 라이브 탭 배경 강조 (비활성 시) */}
              {isLive && !isActive && (
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-700/50"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}

              {/* HOI4 탭 배경 강조 (비활성 시) */}
              {isHoi4 && !isActive && (
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/50"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}

              <tab.icon className="w-4 h-4 z-20" />
              <span className="z-20 hidden sm:inline">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
