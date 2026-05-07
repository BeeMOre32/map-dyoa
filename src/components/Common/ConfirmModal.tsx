'use client';

import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useScrollLock } from '@/hooks/useScrollLock';

interface ConfirmModalProps {
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  message,
  confirmLabel = '삭제',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useScrollLock();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-3xl shadow-2xl dark:shadow-black/60 border border-slate-100 dark:border-slate-800 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-500 dark:text-red-400" />
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
            {message}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors disabled:opacity-60"
          >
            {isLoading ? '처리 중...' : confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
