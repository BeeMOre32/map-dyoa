'use client';

import { motion } from 'motion/react';
import ModalOverlayPortal from '@/components/Common/ModalOverlayPortal';
import { backdropVariants, smoothModalVariants } from '@/lib/modalVariants';
import { useScrollLock } from '@/hooks/useScrollLock';
import {
  skeletonBarVariants,
  skeletonContainerVariants,
} from '@/lib/calendarMotion';
import CalendarShimmerBar from '@/components/Calendar/CalendarShimmerBar';

/** 모달 로딩 — 배경 페이드 + 카드 스프링, 바 shimmer */
export function ScheduleDetailModalSkeleton({
  showSidePanel = true,
}: {
  showSidePanel?: boolean;
}) {
  useScrollLock();

  return (
    <ModalOverlayPortal>
    <motion.div
      initial="hidden"
      animate="visible"
      variants={backdropVariants}
      className="fixed inset-0 z-70 flex items-end justify-center p-0 sm:items-center sm:p-4"
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md dark:bg-slate-950/80"
      />
      <motion.div
        style={{ display: 'flex' }}
        className="flex w-full sm:w-auto sm:flex-row sm:items-start sm:gap-3"
      >
        <motion.div
          variants={smoothModalVariants}
          style={{ display: 'flex', flexDirection: 'column' }}
          className="flex w-full max-h-[92dvh] flex-col overflow-hidden rounded-t-4xl border border-slate-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800 sm:max-h-[90dvh] sm:max-w-lg sm:rounded-[2.5rem]"
        >
          <CalendarShimmerBar className="h-16 w-full shrink-0 rounded-none" />
          <motion.div
            variants={skeletonContainerVariants}
            initial="hidden"
            animate="visible"
            style={{ display: 'flex', flexDirection: 'column' }}
            className="flex-1 space-y-5 overflow-hidden p-5 sm:p-8"
          >
            <motion.div variants={skeletonBarVariants} custom={0}>
              <CalendarShimmerBar className="h-9 w-3/4" />
            </motion.div>
            <motion.div
              style={{ display: 'flex' }}
              className="flex flex-wrap gap-2"
            >
              <motion.div variants={skeletonBarVariants} custom={1}>
                <CalendarShimmerBar className="h-9 w-28 rounded-2xl" />
              </motion.div>
              <motion.div variants={skeletonBarVariants} custom={2}>
                <CalendarShimmerBar className="h-9 w-36 rounded-2xl" />
              </motion.div>
            </motion.div>
            <motion.div
              variants={skeletonContainerVariants}
              style={{ display: 'flex', flexDirection: 'column' }}
              className="space-y-2"
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.div key={i} variants={skeletonBarVariants} custom={3 + i}>
                  <CalendarShimmerBar className="h-9 w-28 rounded-2xl" />
                </motion.div>
              ))}
            </motion.div>
            <motion.div variants={skeletonBarVariants} custom={6}>
              <CalendarShimmerBar className="h-12 w-full rounded-2xl" />
            </motion.div>
            <motion.div
              style={{ display: 'flex' }}
              className="flex gap-3 border-t border-slate-100 pt-4 dark:border-slate-700"
            >
              <motion.div variants={skeletonBarVariants} custom={7} className="flex-1">
                <CalendarShimmerBar className="h-14 w-full rounded-3xl" />
              </motion.div>
              <motion.div variants={skeletonBarVariants} custom={8}>
                <CalendarShimmerBar className="h-14 w-14 rounded-3xl" />
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
        {showSidePanel && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 360, delay: 0.08 }}
            style={{ display: 'flex', flexDirection: 'column' }}
            className="hidden max-h-[90dvh] w-72 flex-col overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800 sm:flex"
          >
            <CalendarShimmerBar className="h-12 w-full rounded-none" />
            <motion.div
              variants={skeletonContainerVariants}
              initial="hidden"
              animate="visible"
              style={{ display: 'flex', flexDirection: 'column' }}
              className="space-y-3 p-4"
            >
              <CalendarShimmerBar className="h-8 w-20" />
              <CalendarShimmerBar className="h-14 w-full rounded-2xl" />
              <CalendarShimmerBar className="h-14 w-full rounded-2xl" />
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
    </ModalOverlayPortal>
  );
}

export function DayScheduleModalSkeleton() {
  useScrollLock();

  return (
    <ModalOverlayPortal>
    <motion.div
      initial="hidden"
      animate="visible"
      variants={backdropVariants}
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm dark:bg-slate-950/60"
      />
      <motion.div
        variants={smoothModalVariants}
        style={{ display: 'flex', flexDirection: 'column' }}
        className="flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <motion.div
          variants={skeletonContainerVariants}
          initial="hidden"
          animate="visible"
          style={{ display: 'flex', flexDirection: 'column' }}
          className="shrink-0 border-b border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900"
        >
          <motion.div variants={skeletonBarVariants} custom={0}>
            <CalendarShimmerBar className="h-8 w-40" />
          </motion.div>
          <motion.div variants={skeletonBarVariants} custom={1} className="mt-2">
            <CalendarShimmerBar className="h-4 w-28 rounded-lg" />
          </motion.div>
        </motion.div>
        <motion.div
          variants={skeletonContainerVariants}
          initial="hidden"
          animate="visible"
          style={{ display: 'flex', flexDirection: 'column' }}
          className="flex-1 space-y-4 overflow-hidden bg-slate-50/30 p-6 dark:bg-slate-950/40"
        >
          {Array.from({ length: 2 }).map((_, i) => (
            <motion.div
              key={i}
              variants={skeletonBarVariants}
              custom={i}
            >
              <CalendarShimmerBar className="h-36 rounded-4xl border border-slate-100 dark:border-slate-800" />
            </motion.div>
          ))}
        </motion.div>
        <motion.div className="shrink-0 border-t border-slate-100 p-6 dark:border-slate-800">
          <CalendarShimmerBar className="mx-auto h-12 w-32 rounded-2xl" />
        </motion.div>
      </motion.div>
    </motion.div>
    </ModalOverlayPortal>
  );
}

export function CalendarPageSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column' }}
      className="flex min-h-0 flex-1 flex-col gap-3 bg-slate-50/50 p-4 dark:bg-slate-950 md:p-6"
    >
      <div className="flex shrink-0 items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 400 }}
          style={{ display: 'flex' }}
          className="flex items-center gap-2"
        >
          <CalendarShimmerBar className="h-9 w-9" />
          <CalendarShimmerBar className="h-6 w-32 rounded-full" />
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320, delay: 0.05 }}
        style={{ display: 'flex', flexDirection: 'column' }}
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900"
      >
        <motion.div
          variants={skeletonContainerVariants}
          initial="hidden"
          animate="visible"
          className="grid shrink-0 grid-cols-7 border-b border-slate-100 dark:border-slate-800"
        >
          {Array.from({ length: 7 }).map((_, i) => (
            <motion.div
              key={i}
              variants={skeletonBarVariants}
              custom={i}
              className="flex justify-center py-3"
            >
              <CalendarShimmerBar className="h-3.5 w-3.5 rounded" />
            </motion.div>
          ))}
        </motion.div>
        <motion.div
          variants={skeletonContainerVariants}
          initial="hidden"
          animate="visible"
          className="grid flex-1 grid-cols-7"
        >
          {Array.from({ length: 7 }).map((_, i) => (
            <motion.div
              key={i}
              variants={skeletonBarVariants}
              custom={i + 7}
              className="space-y-1.5 border-b border-r border-slate-100 p-2 last:border-r-0 dark:border-slate-800"
            >
              <CalendarShimmerBar className="h-7 w-7 rounded-full" />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
