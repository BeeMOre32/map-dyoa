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
    <div className="p-6 md:p-8 border-b border-slate-50 dark:border-slate-700 flex justify-between items-start shrink-0 bg-slate-50/50 dark:bg-slate-700/30">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <CalendarIcon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
            {isEdit ? 'Edit Schedule' : 'New Schedule'}
          </p>
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
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
