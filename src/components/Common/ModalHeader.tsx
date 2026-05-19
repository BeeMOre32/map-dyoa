/**
 * 모달 헤더 컴포넌트
 * 여러 모달에서 반복되는 헤더 구조를 통합
 */

'use client';

import { X, LucideIcon } from 'lucide-react';

interface ModalHeaderProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  onClose: () => void;
}

/**
 * 통합된 모달 헤더
 */
export function ModalHeader({
  icon: Icon,
  title,
  subtitle,
  onClose,
}: ModalHeaderProps) {
  return (
    <div className="flex items-start justify-between border-b border-slate-50 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-700/30 sm:p-6 md:p-8">
      <div className="flex flex-1 items-center gap-3 sm:gap-4">
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900 sm:h-12 sm:w-12 sm:rounded-2xl">
            <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400 sm:h-6 sm:w-6" />
          </div>
        )}
        <div className="min-w-0">
          {title && (
            <p className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 sm:text-xs">
              {title}
            </p>
          )}
          {subtitle && (
            <h3 className="mt-0.5 text-lg font-black text-slate-800 dark:text-white sm:mt-1 sm:text-xl md:text-2xl">
              {subtitle}
            </h3>
          )}
        </div>
      </div>
      <button
        onClick={onClose}
        className="shrink-0 rounded-full p-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-600 sm:p-2"
        aria-label="Close modal"
      >
        <X className="h-5 w-5 text-slate-400 sm:h-6 sm:w-6" />
      </button>
    </div>
  );
}

export default ModalHeader;
