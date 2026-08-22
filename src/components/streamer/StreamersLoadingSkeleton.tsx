'use client';

import { motion } from 'motion/react';
import CalendarShimmerBar from '@/components/Calendar/CalendarShimmerBar';

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, damping: 28, stiffness: 360, delay: Math.min(i * 0.04, 0.28) },
  }),
};

export default function StreamersLoadingSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 transition-colors dark:bg-slate-950">
      <div className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900 sm:rounded-3xl">
        <motion.div
          className="flex shrink-0 items-center justify-between border-b border-slate-50 bg-slate-50/30 p-4 dark:border-slate-700 dark:bg-slate-800/20 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div className="space-y-2" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
            <CalendarShimmerBar className="h-6 w-32 sm:w-40" />
            <CalendarShimmerBar className="h-4 w-48 sm:w-56" />
          </motion.div>
        </motion.div>

        <div className="flex-1 p-3 sm:p-6">
          <motion.div
            className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
            initial="hidden"
            animate="visible"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={cardVariants}
                className="flex flex-col rounded-2xl border border-slate-100 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 sm:rounded-3xl sm:p-5"
              >
                <motion.div className="mb-3 flex justify-between sm:mb-4">
                  <CalendarShimmerBar className="h-11 w-11 rounded-xl sm:h-14 sm:w-14 sm:rounded-2xl" />
                  <CalendarShimmerBar className="h-6 w-6 rounded-lg" />
                </motion.div>
                <CalendarShimmerBar className="mb-1 h-5 w-24" />
                <CalendarShimmerBar className="h-4 w-20" />
                <div className="mt-4 flex gap-2 sm:mt-6">
                  <CalendarShimmerBar className="h-5 w-10 rounded-xl" />
                  <CalendarShimmerBar className="ml-auto h-7 w-7 rounded-lg sm:h-8 sm:w-8" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
