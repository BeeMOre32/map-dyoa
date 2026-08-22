'use client';

import { motion } from 'motion/react';
import CalendarShimmerBar from '@/components/Calendar/CalendarShimmerBar';
import { clipSkeletonCardVariants } from '@/lib/clipMotion';

export function ClipSkeletonCard({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={clipSkeletonCardVariants}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800 sm:rounded-3xl"
    >
      <CalendarShimmerBar className="aspect-video w-full rounded-none" />
      <motion.div className="space-y-2 p-3">
        <CalendarShimmerBar className="h-3.5 w-4/5" />
        <CalendarShimmerBar className="h-3 w-2/3" />
        <div className="flex gap-1.5 pt-1">
          <CalendarShimmerBar className="h-5 w-12 rounded-full" />
          <CalendarShimmerBar className="h-5 w-16 rounded-full" />
        </div>
      </motion.div>
    </motion.div>
  );
}
