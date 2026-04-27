'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Users, Clapperboard } from 'lucide-react';

const tabs = [
  { id: 'calendar', label: '스케줄', href: '/calendar', icon: Calendar },
  { id: 'streamers', label: '지도동 멤버', href: '/streamers', icon: Users },
  { id: 'clips', label: '클립 모음', href: '/clips', icon: Clapperboard, isNew: true },
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
          const isClip = tab.id === 'clips';

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`relative flex items-center gap-1.5 px-3 py-2 sm:px-6 sm:py-2.5 md:px-8 rounded-2xl text-sm font-black transition-all z-10 ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : isClip
                    ? 'text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300'
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

              {/* 클립 탭 배경 강조 (비활성 시) */}
              {isClip && !isActive && (
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200/60 dark:border-indigo-700/50"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              <tab.icon className="w-4 h-4 z-20" />
              <span className="z-20 hidden sm:inline">{tab.label}</span>

              {/* NEW 뱃지 */}
              {tab.isNew && !isActive && (
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 14, stiffness: 300, delay: 0.3 }}
                  className="z-20 text-[9px] font-black px-1.5 py-px rounded-full bg-indigo-500 text-white leading-none tracking-wide"
                >
                  NEW
                </motion.span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
