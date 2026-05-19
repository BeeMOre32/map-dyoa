'use client';

import { X, Calendar as CalendarIcon } from 'lucide-react';
import { CreateMode } from '../types';

type ModalHeaderProps = {
  isEdit: boolean;
  createMode: CreateMode;
  slotCount: number;
  onClose: () => void;
};

export default function ModalHeader({
  isEdit,
  createMode,
  slotCount,
  onClose,
}: ModalHeaderProps) {
  return (
    <div className="flex shrink-0 items-start justify-between border-b border-slate-50 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-700/30 sm:p-6 md:p-8">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400 sm:h-12 sm:w-12 sm:rounded-2xl">
          <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 sm:text-xs">
            {isEdit ? 'Edit Schedule' : 'New Schedule'}
          </p>
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 sm:text-xl md:text-2xl">
            {isEdit
              ? '일정 수정'
              : createMode === 'batch' && slotCount > 1
                ? `일정 ${slotCount}개 등록`
                : '새 일정 등록'}
          </h3>
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full transition-colors"
      >
        <X className="w-6 h-6 text-slate-400" />
      </button>
    </div>
  );
}
