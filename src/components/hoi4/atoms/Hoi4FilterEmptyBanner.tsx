'use client';

import { motion } from 'motion/react';
import { FilterX } from 'lucide-react';
import { statsInteractiveHover } from '@/lib/statsMotion';

interface Hoi4FilterEmptyBannerProps {
  onClear: () => void;
}

export default function Hoi4FilterEmptyBanner({
  onClear,
}: Hoi4FilterEmptyBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-2.5">
        <FilterX className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
          선택한 필터 조건에 맞는 HOI4 참전 기록이 없어요
        </p>
      </div>
      <motion.button
        type="button"
        onClick={onClear}
        {...statsInteractiveHover}
        className="shrink-0 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-black text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
      >
        필터 초기화
      </motion.button>
    </motion.div>
  );
}
