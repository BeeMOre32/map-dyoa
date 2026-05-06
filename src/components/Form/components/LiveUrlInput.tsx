'use client';

import { useCallback } from 'react';
import { Link as LinkIcon, Loader2, Sparkles, CheckCircle2, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type LiveUrlInputProps = {
  liveUrls: string[];
  setLiveUrls: React.Dispatch<React.SetStateAction<string[]>>;
  metaLoading: boolean;
  autoFilled: string[];
  setAutoFilled: React.Dispatch<React.SetStateAction<string[]>>;
  onUrlBlur: (urlIndex: number) => Promise<void>;
  size?: 'normal' | 'compact';
};

export default function LiveUrlInput({
  liveUrls,
  setLiveUrls,
  metaLoading,
  autoFilled,
  setAutoFilled,
  onUrlBlur,
  size = 'normal',
}: LiveUrlInputProps) {
  const handleRemoveUrl = useCallback(
    (index: number) => {
      setLiveUrls((prev) => prev.filter((_, idx) => idx !== index));
    },
    [setLiveUrls],
  );

  const handleAddUrl = useCallback(() => {
    setLiveUrls((prev) => [...prev, '']);
  }, [setLiveUrls]);

  const padding = size === 'compact' ? 'py-2 pl-8 pr-8 text-sm' : 'py-3 pl-9 pr-9';
  const iconSize = size === 'compact' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const closeSize = size === 'compact' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
          방송 링크
          <span className="ml-1.5 normal-case font-medium text-indigo-400 dark:text-indigo-500">
            · 치지직 URL 입력 시 자동 채우기
          </span>
        </label>
        {metaLoading && (
          <Loader2 className={`${iconSize} text-indigo-400 animate-spin`} />
        )}
        {!metaLoading && autoFilled.length > 0 && (
          <Sparkles className={`${iconSize} text-indigo-400`} />
        )}
      </div>
      <div className="space-y-2">
        {liveUrls.map((url, i) => (
          <div key={i} className="relative">
            <LinkIcon className={`absolute left-3 top-1/2 -translate-y-1/2 ${iconSize} text-slate-400`} />
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setLiveUrls((prev) =>
                  prev.map((u, idx) => (idx === i ? e.target.value : u)),
                );
                if (autoFilled.length) setAutoFilled([]);
              }}
              onBlur={() => onUrlBlur(i)}
              placeholder="https://chzzk.naver.com/live/..."
              className={`w-full pl-9 pr-9 ${padding} bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all`}
            />
            {liveUrls.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveUrl(i)}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-300 dark:text-slate-600 hover:text-red-400 transition-colors`}
              >
                <X className={closeSize} />
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={handleAddUrl}
        className="mt-2 flex items-center gap-1.5 text-xs font-bold text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
      >
        <Plus className={iconSize} />
        URL 추가
      </button>
      <AnimatePresence>
        {autoFilled.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800"
          >
            <CheckCircle2 className={`w-3.5 h-3.5 text-indigo-500 shrink-0`} />
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              자동 입력됨: {autoFilled.join(' · ')}
            </p>
            <button
              type="button"
              onClick={() => setAutoFilled([])}
              className="ml-auto text-indigo-300 hover:text-indigo-500 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
