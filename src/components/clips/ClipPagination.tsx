'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { buildPageItems } from '@/hooks/useClipNavigation';
import { CLIP_PAGE_TAB_LAYOUT_ID, clipPaginationBarVariants } from '@/lib/clipMotion';

interface ClipPaginationProps {
  currentPage: number;
  totalPages: number;
  isPending?: boolean;
  onNavigate: (page: number) => void;
}

export function ClipPagination({ currentPage, totalPages, isPending, onNavigate }: ClipPaginationProps) {
  if (totalPages <= 1) return null;

  const pageItems = buildPageItems(totalPages, currentPage);

  return (
    <AnimatePresence>
      <motion.div
        key="pagination"
        variants={clipPaginationBarVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="flex shrink-0 items-center justify-center gap-1.5 border-t border-slate-100 px-4 py-3 dark:border-slate-800"
      >
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate(currentPage - 1)}
          disabled={currentPage <= 1 || isPending}
          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </motion.button>

        {pageItems.map((item, i) =>
          item === 'ellipsis' ? (
            <span key={`e${i}`} className="px-1 text-sm text-slate-400 dark:text-slate-500">
              …
            </span>
          ) : (
            <motion.button
              key={item}
              type="button"
              layout
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate(item as number)}
              disabled={isPending}
              className={`relative h-8 w-8 rounded-lg text-xs font-bold transition-colors disabled:cursor-not-allowed ${
                item === currentPage
                  ? 'text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {item === currentPage && (
                <motion.span
                  layoutId={CLIP_PAGE_TAB_LAYOUT_ID}
                  className="absolute inset-0 rounded-lg bg-indigo-600 shadow-md shadow-indigo-300/50 dark:shadow-indigo-900/40"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span className="relative z-10">{item}</span>
            </motion.button>
          ),
        )}

        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate(currentPage + 1)}
          disabled={currentPage >= totalPages || isPending}
          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}
