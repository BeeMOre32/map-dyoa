'use client';

import { motion } from 'motion/react';
import CalendarShimmerBar from '@/components/Calendar/CalendarShimmerBar';
import ModalOverlayPortal from '@/components/Common/ModalOverlayPortal';
import { backdropVariants, smoothModalVariants } from '@/lib/modalVariants';
import {
  skeletonBarVariants,
  skeletonContainerVariants,
} from '@/lib/calendarMotion';
import { useScrollLock } from '@/hooks/useScrollLock';

/** 스트리머 상세 모달 로딩 — 실제 모달과 동일한 포털·크기·배경 */
export default function StreamerDetailModalSkeleton() {
  useScrollLock();

  return (
    <ModalOverlayPortal>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={backdropVariants}
        className="fixed inset-0 z-100 flex items-center justify-center p-4 md:p-8"
      >
        <motion.div
          aria-hidden
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-xl dark:bg-slate-950/80"
        />

        <motion.div
          variants={smoothModalVariants}
          initial="hidden"
          animate="visible"
          className="relative flex w-full max-w-2xl max-h-[90dvh] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-900/60 sm:rounded-[2.5rem]"
        >
          <motion.div className="relative h-20 shrink-0 overflow-visible sm:h-28">
            <CalendarShimmerBar className="h-full w-full rounded-none bg-linear-to-br from-indigo-200/90 via-indigo-100/50 to-slate-100/40 dark:from-indigo-950/80 dark:via-slate-800/60 dark:to-slate-900/40" />
            <CalendarShimmerBar className="absolute top-4 right-4 h-9 w-9 rounded-full" />
            <motion.div className="absolute -bottom-8 left-4 z-10 sm:-bottom-10 sm:left-8">
              <CalendarShimmerBar className="h-16 w-16 rounded-[1.25rem] ring-4 ring-white dark:ring-slate-900 sm:h-20 sm:w-20" />
            </motion.div>
          </motion.div>

          <motion.div className="shrink-0 border-b border-slate-100 px-4 pb-4 pt-11 dark:border-slate-800 sm:px-8 sm:pb-6 sm:pt-14">
            <motion.div
              variants={skeletonContainerVariants}
              initial="hidden"
              animate="visible"
              className="flex items-start justify-between gap-3 sm:gap-4"
            >
              <motion.div className="min-w-0 flex-1 space-y-2.5">
                <motion.div variants={skeletonBarVariants} custom={0}>
                  <CalendarShimmerBar className="h-7 w-36 sm:h-8 sm:w-44" />
                </motion.div>
                <motion.div className="flex flex-wrap gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i} variants={skeletonBarVariants} custom={1 + i}>
                      <CalendarShimmerBar className="h-6 w-14 rounded-full sm:w-16" />
                    </motion.div>
                  ))}
                </motion.div>
                <motion.div variants={skeletonBarVariants} custom={4} className="flex gap-2 pt-0.5">
                  <CalendarShimmerBar className="h-8 w-20 rounded-xl" />
                  <CalendarShimmerBar className="h-8 w-20 rounded-xl" />
                </motion.div>
              </motion.div>
              <motion.div className="flex shrink-0 gap-4 sm:gap-6">
                {[0, 1].map((i) => (
                  <motion.div
                    key={i}
                    variants={skeletonBarVariants}
                    custom={5 + i}
                    className="space-y-1 text-center"
                  >
                    <CalendarShimmerBar className="mx-auto h-6 w-8 sm:h-7 sm:w-10" />
                    <CalendarShimmerBar className="mx-auto h-2.5 w-8 rounded-md" />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div className="shrink-0 space-y-5 p-4 sm:space-y-6 sm:p-6 md:p-8">
            <motion.div className="space-y-3">
              <CalendarShimmerBar className="h-3 w-20 rounded-md" />
              <CalendarShimmerBar className="h-16 w-full rounded-2xl" />
              <CalendarShimmerBar className="h-4 w-full rounded-lg" />
            </motion.div>
            <motion.div className="space-y-3">
              <CalendarShimmerBar className="h-3 w-24 rounded-md" />
              <CalendarShimmerBar className="h-18 w-full rounded-2xl border border-slate-100 dark:border-slate-800" />
              <CalendarShimmerBar className="h-18 w-full rounded-2xl border border-slate-100 dark:border-slate-800" />
            </motion.div>
          </motion.div>

          <motion.div className="flex shrink-0 gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-slate-800 dark:bg-slate-800/30 sm:gap-3 sm:px-8 sm:py-5">
            <CalendarShimmerBar className="h-12 flex-1 rounded-2xl sm:h-14" />
            <CalendarShimmerBar className="h-12 flex-1 rounded-2xl sm:h-14" />
          </motion.div>
        </motion.div>
      </motion.div>
    </ModalOverlayPortal>
  );
}
