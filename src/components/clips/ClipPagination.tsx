'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buildPageItems } from '@/hooks/useClipNavigation';

interface ClipPaginationProps {
  currentPage: number;
  totalPages: number;
  onNavigate: (page: number) => void;
}

export function ClipPagination({ currentPage, totalPages, onNavigate }: ClipPaginationProps) {
  if (totalPages <= 1) return null;

  const pageItems = buildPageItems(totalPages, currentPage);

  return (
    <div className="flex items-center justify-center gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
      <button
        onClick={() => onNavigate(currentPage - 1)}
        disabled={currentPage <= 1}
        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pageItems.map((item, i) =>
        item === 'ellipsis' ? (
          <span key={`e${i}`} className="px-1 text-slate-400 dark:text-slate-500 text-sm">…</span>
        ) : (
          <button
            key={item}
            onClick={() => onNavigate(item as number)}
            className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors ${
              item === currentPage
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-300/50 dark:shadow-indigo-900/40'
                : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {item}
          </button>
        ),
      )}

      <button
        onClick={() => onNavigate(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
