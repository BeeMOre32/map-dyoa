'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CreateMode } from '../types';

type ModeTabsProps = {
  createMode: CreateMode;
  setCreateMode: (mode: CreateMode) => void;
};

const modes: { key: CreateMode; label: string; suffix?: string }[] = [
  { key: 'live', label: 'LIVE', suffix: 'β' },
  { key: 'single', label: '단일' },
  { key: 'batch', label: '일괄' },
  { key: 'image', label: '이미지', suffix: 'AI' },
  { key: 'text', label: '텍스트', suffix: 'AI' },
];

export default function ModeTabs({ createMode, setCreateMode }: ModeTabsProps) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });

  const syncPill = useCallback(() => {
    const i = modes.findIndex((m) => m.key === createMode);
    const btn = btnRefs.current[i];
    const container = containerRef.current;
    if (!btn || !container) return;
    const c = container.getBoundingClientRect();
    const b = btn.getBoundingClientRect();
    setPill({
      left: b.left - c.left,
      width: b.width,
      ready: true,
    });
  }, [createMode]);

  useLayoutEffect(() => {
    syncPill();
    const ro = new ResizeObserver(() => syncPill());
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', syncPill);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', syncPill);
    };
  }, [syncPill]);

  return (
    <div className="shrink-0 px-6 pb-0 pt-4 md:px-8">
      <div
        ref={containerRef}
        className="relative flex gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1 dark:bg-slate-700/60"
      >
        {pill.ready && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute top-1 bottom-1 rounded-xl bg-white shadow-sm dark:bg-slate-600"
            initial={false}
            animate={{ left: pill.left, width: pill.width }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 520, damping: 38, mass: 0.7 }
            }
          />
        )}
        {modes.map(({ key, label, suffix }, i) => {
          const active = createMode === key;
          return (
            <button
              key={key}
              ref={(el) => {
                btnRefs.current[i] = el;
              }}
              type="button"
              onClick={() => setCreateMode(key)}
              className={`relative z-10 min-w-[4.25rem] flex-1 shrink-0 rounded-xl py-2 text-xs font-black transition-colors ${
                active
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
              }`}
            >
              {label}
              {suffix && (
                <span
                  className={`ml-1 text-[9px] font-black ${
                    key === 'live'
                      ? 'text-rose-500 dark:text-rose-400'
                      : 'text-violet-500 dark:text-violet-400'
                  }`}
                >
                  {suffix}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
