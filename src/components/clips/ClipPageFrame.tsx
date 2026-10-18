'use client';

import { AnimatePresence, motion } from 'motion/react';
import { usePathname } from 'next/navigation';
import ClipSectionSwitch from './ClipSectionSwitch';

const spring = { type: 'spring' as const, bounce: 0.16, visualDuration: 0.38 };

export default function ClipPageFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const week = pathname.startsWith('/clips/week');

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50/50 p-0 transition-colors dark:bg-slate-950 sm:p-4">
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-none border-x-0 border-slate-100 bg-white shadow-none dark:border-slate-800 dark:bg-slate-900 sm:rounded-3xl sm:border sm:shadow-xl sm:shadow-slate-200/50 dark:sm:shadow-slate-900/50">
        <div className="shrink-0 border-b border-slate-50 bg-slate-50/80 p-2 dark:border-slate-700 dark:bg-slate-800/40 sm:p-4">
          <ClipSectionSwitch />
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={week ? 'week' : 'all'}
            initial={{ opacity: 0, x: week ? 28 : -28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: week ? 28 : -28 }}
            transition={spring}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
