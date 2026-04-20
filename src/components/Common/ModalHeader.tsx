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
    <div className="p-8 border-b border-slate-50 dark:border-slate-700 flex justify-between items-start bg-slate-50/50 dark:bg-slate-700/30">
      <div className="flex items-center gap-4 flex-1">
        {Icon && (
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-2xl flex items-center justify-center shrink-0">
            <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
        )}
        <div>
          {title && (
            <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase">
              {title}
            </p>
          )}
          {subtitle && (
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
              {subtitle}
            </h3>
          )}
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full shrink-0 transition-colors"
        aria-label="Close modal"
      >
        <X className="w-6 h-6 text-slate-400" />
      </button>
    </div>
  );
}

export default ModalHeader;
