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
    <div className="flex shrink-0 flex-col gap-2 border-t border-slate-100 bg-slate-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-slate-700 dark:bg-slate-800 sm:gap-3 sm:p-6 md:p-8">
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
          className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 sm:rounded-2xl sm:py-4"
        >
          취소
        </button>
        <button
          type="button"
          disabled={isSubmitting || disabled}
          onClick={() => {
            const form = document.getElementById(formId);
            if (form instanceof HTMLFormElement) {
              form.requestSubmit();
            }
          }}
          className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-700 disabled:opacity-50 sm:rounded-2xl sm:py-4"
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
