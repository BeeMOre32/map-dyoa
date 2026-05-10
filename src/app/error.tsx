'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-8 text-center gap-6">
      <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-black text-slate-800 dark:text-white">
          페이지를 불러올 수 없습니다
        </h2>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
        </p>
        {error.digest && (
          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
            오류 코드: {error.digest}
          </p>
        )}
      </div>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
      >
        <RotateCcw className="w-4 h-4" />
        다시 시도
      </button>
    </div>
  );
}
