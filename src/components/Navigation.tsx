'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Users } from 'lucide-react';

const tabs = [
  { id: 'calendar', label: '스케줄', href: '/calendar', icon: Calendar },
  { id: 'streamers', label: '지도동 멤버', href: '/streamers', icon: Users },
];

export default function Navigation() {
  const pathname = usePathname();

  const isModalOpen =
    pathname.includes('/calendar/schedule/') ||
    pathname.includes('/calendar/day/') ||
    pathname.includes('/streamers/detail/');

  if (isModalOpen) return null;

  return (
    <nav className="flex justify-center py-6 shrink-0 bg-white dark:bg-slate-950 transition-colors z-30">
      <div className="rounded-xl flex bg-slate-100 dark:bg-slate-900 p-1.5 border-2 border-slate-200 dark:border-slate-800 relative shadow-inner">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`relative flex items-center gap-2 px-8 py-2.5 rounded-2xl text-sm font-black transition-all z-10 ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
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

              <tab.icon className="w-4 h-4 z-20" />
              <span className="z-20">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
