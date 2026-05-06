'use client';

import { AlertCircle } from 'lucide-react';

type ModalFooterProps = {
  error?: string | null;
  isSubmitting: boolean;
  loadingText?: string;
  submittingText?: string;
  submitText?: string;
  onClose: () => void;
  formId: string;
  disabled?: boolean;
};

export default function ModalFooter({
  error,
  isSubmitting,
  loadingText = '정보 가져오는 중...',
  submittingText = '저장 중...',
  submitText = '일정 등록',
  onClose,
  formId,
  disabled = false,
}: ModalFooterProps) {
  const isLoading = false;

  return (
    <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-800 flex flex-col gap-3 border-t border-slate-100 dark:border-slate-700 shrink-0">
      {error && (
        <p className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-4 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
        >
          취소
        </button>
        <button
          form={formId}
          type="submit"
          disabled={isSubmitting || disabled}
          className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
        >
          {isLoading
            ? loadingText
            : isSubmitting
              ? submittingText
              : submitText}
        </button>
      </div>
    </div>
  );
}
