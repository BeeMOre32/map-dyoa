'use client';

import { useState, useTransition } from 'react';
import { Gamepad2, X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { createGameAction } from '@/app/actions';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import {
  backdropVariants,
  compactModalVariants,
} from '@/lib/modalVariants';

type Props = {
  initialTitle: string;
  onClose: () => void;
  onCreated: (game: { id: string; title: string }) => void;
};

export default function QuickAddGameModal({
  initialTitle,
  onClose,
  onCreated,
}: Props) {
  const reduceMotion = useReducedMotion();
  const [title, setTitle] = useState(initialTitle.trim());
  const [isHoi4, setIsHoi4] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  useEscapeKey(onClose);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      const res = await createGameAction({ title, isHoi4 });
      if (!res.success) {
        setError(res.error ?? '게임 등록에 실패했습니다.');
        return;
      }
      onCreated(res.data);
      onClose();
    });
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={backdropVariants}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        variants={compactModalVariants}
        className="w-full max-w-sm space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <motion.div
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
              animate={
                reduceMotion
                  ? undefined
                  : { rotate: [0, -8, 8, 0], scale: [1, 1.06, 1] }
              }
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <Gamepad2 className="h-4 w-4" />
            </motion.div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                New Game
              </p>
              <h3 className="text-base font-black text-slate-800 dark:text-white">
                게임 등록
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs font-bold text-slate-400">
          치지직 카테고리가 목록에 없을 때 이름으로 추가합니다. 잡담·캠방처럼 게임이
          아니면 건너뛰세요.
        </p>

        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wide text-slate-400">
              게임 제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              required
              autoFocus
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              placeholder="예) 마인크래프트"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsHoi4((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-900"
          >
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
              HOI4로 분류
            </span>
            <div
              className={`relative h-6 w-10 rounded-full transition-colors ${
                isHoi4 ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-600'
              }`}
            >
              <motion.div
                layout
                className="absolute top-1 h-4 w-4 rounded-full bg-white shadow"
                animate={{ x: isHoi4 ? 20 : 4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </div>
          </button>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-500 dark:bg-red-900/20"
            >
              {error}
            </motion.p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-black text-slate-600 dark:bg-slate-700 dark:text-slate-200"
            >
              취소
            </button>
            <motion.button
              type="submit"
              disabled={pending || !title.trim()}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-black text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {pending ? '등록 중…' : '등록하고 선택'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
