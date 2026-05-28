'use client';

import { motion } from 'framer-motion';
import { Sword } from 'lucide-react';

export default function Hoi4EmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center bg-white dark:bg-slate-950">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        className="space-y-3 p-8 text-center"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 dark:bg-amber-900/20">
          <Sword className="h-8 w-8 text-amber-300 dark:text-amber-700" />
        </div>
        <p className="font-black text-slate-500 dark:text-slate-400">
          아직 HOI4 전적이 없습니다
        </p>
        <p className="text-sm font-medium leading-relaxed text-slate-400 dark:text-slate-500">
          HOI4 일정에서 <strong className="text-amber-600 dark:text-amber-400">내전 세션</strong>을
          체크하거나
          <br />
          멤버별 <strong className="text-amber-600 dark:text-amber-400">국가</strong>를 입력하면
          여기에 모입니다
        </p>
      </motion.div>
    </div>
  );
}
