'use client';

import { motion } from 'motion/react';

/** Motion skeleton-shimmer 스타일 — CSS 그라데이션 + opacity 펄스 */
export default function CalendarShimmerBar({ className }: { className?: string }) {
  return (
    <motion.div
      className={`skeleton-shimmer rounded-xl ${className ?? ''}`}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.45, 0.9, 0.45] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}
