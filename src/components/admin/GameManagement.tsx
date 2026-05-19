'use client';

import { useState, useTransition } from 'react';
import { Plus, SquarePen, Trash2, Gamepad2, X, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { createGameAction, updateGameAction, deleteGameAction } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import { useEscapeKey } from '@/hooks/useEscapeKey';

type Game = {
  id: string;
  title: string;
  isHoi4: boolean;
  _count: { schedules: number };
};

function GameFormModal({
  initial,
  onClose,
}: {
  initial?: Game;
  onClose: () => void;
}) {
  const router = useRouter();
  const dismiss = useModalDismiss({ mother: '/admin/games', onClose });
  useEscapeKey(dismiss);
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [isHoi4, setIsHoi4] = useState(initial?.isHoi4 ?? false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      const result = initial
        ? await updateGameAction(initial.id, { title, isHoi4 })
        : await createGameAction({ title, isHoi4 });

      if (result.success) {
        router.refresh();
        dismiss();
      } else {
        setError(result.error ?? '오류가 발생했습니다.');
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={dismiss}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-800 dark:text-white">
            {initial ? '게임 수정' : '게임 추가'}
          </h2>
          <button onClick={dismiss} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">게임 제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) HOI4, 마인크래프트..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700"
              required
            />
          </div>

          <button
            type="button"
            onClick={() => setIsHoi4(!isHoi4)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">HOI4 게임으로 분류</span>
            <div className={`w-10 h-6 rounded-full relative transition-colors ${isHoi4 ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-600'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isHoi4 ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
          </button>

          {error && (
            <p className="text-sm font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-2xl">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={dismiss} className="flex-1 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              취소
            </button>
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors disabled:opacity-50">
              {isPending ? '처리 중...' : initial ? '수정 완료' : '추가'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function DeleteGameButton({ game }: { game: Game }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (confirm) {
    return (
      <div className="flex gap-1">
        <button
          onClick={() => startTransition(async () => {
            await deleteGameAction(game.id);
            router.refresh();
          })}
          disabled={isPending}
          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
        </button>
        <button onClick={() => setConfirm(false)} className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-xl transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      disabled={game._count.schedules > 0}
      title={game._count.schedules > 0 ? '연결된 일정이 있어 삭제할 수 없습니다' : '삭제'}
      className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors bg-slate-100 dark:bg-slate-700 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

export default function GameManagement({ games }: { games: Game[] }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Game | null>(null);

  return (
    <div className="p-8 space-y-6 bg-white dark:bg-slate-950 transition-colors">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">게임 관리</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-2">
            일정에 사용되는 게임 목록을 관리합니다.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          게임 추가
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        {games.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 dark:text-slate-500">
            <Gamepad2 className="w-10 h-10 opacity-40" />
            <p className="font-bold text-sm">등록된 게임이 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {games.map((game) => (
              <div key={game.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center shrink-0">
                  <Gamepad2 className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{game.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                      일정 {game._count.schedules}개
                    </span>
                    {game.isHoi4 && (
                      <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-black rounded uppercase tracking-wide">
                        HOI4
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setEditing(game)}
                    className="p-2 text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors bg-slate-100 dark:bg-slate-700 rounded-xl"
                  >
                    <SquarePen className="w-4 h-4" />
                  </button>
                  <DeleteGameButton game={game} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {(createOpen || editing) && (
          <GameFormModal
            initial={editing ?? undefined}
            onClose={() => { setCreateOpen(false); setEditing(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
