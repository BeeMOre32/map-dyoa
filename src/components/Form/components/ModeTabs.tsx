'use client';

import { CreateMode } from '../types';

type ModeTabsProps = {
  createMode: CreateMode;
  setCreateMode: (mode: CreateMode) => void;
};

const modes: { key: CreateMode; label: string }[] = [
  { key: 'single', label: '단일 등록' },
  { key: 'batch', label: '일괄 등록' },
  { key: 'image', label: '이미지' },
  { key: 'text', label: '텍스트' },
];

export default function ModeTabs({ createMode, setCreateMode }: ModeTabsProps) {
  return (
    <div className="px-6 md:px-8 pt-4 pb-0 shrink-0">
      <div className="flex bg-slate-100 dark:bg-slate-700/60 rounded-2xl p-1 gap-1">
        {modes.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setCreateMode(key)}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
              createMode === key
                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {label}
            {(key === 'image' || key === 'text') && (
              <span className="ml-1 text-[9px] font-black px-1 py-0.5 rounded bg-violet-100 dark:bg-violet-900/50 text-violet-500 dark:text-violet-400">
                AI
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
