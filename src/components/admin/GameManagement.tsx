'use client';

import { useState, useTransition } from 'react';
import { Plus, SquarePen, Trash2, Gamepad2, X, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { createGameAction, updateGameAction, deleteGameAction, mergeGamesAction } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { groupGamesBySimilarTitle } from '@/lib/game-title';

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
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Game | null>(null);
  const [mergePending, startMerge] = useTransition();
  const [mergeMsg, setMergeMsg] = useState<string | null>(null);

  const similarGroups = groupGamesBySimilarTitle(games);

  const runMerge = (keepId: string, absorbId: string) => {
    setMergeMsg(null);
    startMerge(async () => {
      const res = await mergeGamesAction(keepId, absorbId);
      if (!res.success) {
        setMergeMsg(res.error ?? '병합 실패');
        return;
      }
      setMergeMsg(`병합 완료 · 일정 ${res.data.moved}건 이동`);
      router.refresh();
    });
  };

  return (
    <div className="p-8 space-y-6 bg-white dark:bg-slate-950 transition-colors">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">게임 관리</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-2">
            일정에 사용되는 게임 목록을 관리합니다. 비슷한 이름은 등록 시 자동으로 기존 게임에 붙습니다.
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

      {mergeMsg && (
        <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          {mergeMsg}
        </p>
      )}

      {similarGroups.length > 0 && (
        <section className="space-y-3 rounded-3xl border border-amber-200/80 bg-amber-50/50 p-5 dark:border-amber-800/50 dark:bg-amber-950/20">
          <h2 className="text-sm font-black text-amber-800 dark:text-amber-300">
            유사 이름 묶음 ({similarGroups.length})
          </h2>
          <p className="text-xs font-bold text-amber-700/80 dark:text-amber-400/80">
            공백·기호만 다른 중복 후보입니다. 남길 게임을 기준으로 나머지를 합치세요.
          </p>
          <ul className="space-y-3">
            {similarGroups.map((group) => {
              const keep = [...group.items].sort(
                (a, b) => b._count.schedules - a._count.schedules,
              )[0];
              return (
                <li
                  key={group.key}
                  className="rounded-2xl border border-amber-200/60 bg-white/80 p-4 dark:border-amber-900/40 dark:bg-slate-900/60"
                >
                  <p className="mb-2 text-[11px] font-bold text-slate-400">
                    권장 유지: {keep.title} (일정 {keep._count.schedules})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((g) => (
                      <div
                        key={g.id}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <span>
                          {g.title}
                          <span className="ml-1 text-slate-400">·{g._count.schedules}</span>
                        </span>
                        {g.id !== keep.id && (
                          <button
                            type="button"
                            disabled={mergePending}
                            onClick={() => runMerge(keep.id, g.id)}
                            className="rounded-lg bg-amber-600 px-2 py-0.5 text-[10px] font-black text-white hover:bg-amber-500 disabled:opacity-50"
                          >
                            → {keep.title}에 합치기
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

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
