'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion';
import {
  Check,
  ExternalLink,
  Loader2,
  Plus,
  Radio,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import type { ScheduleCandidateView } from '@/lib/schedule-candidate-store';
import {
  listPendingLiveCandidatesAction,
  refreshPendingLiveCandidatesAction,
  registerLiveCandidateAction,
} from '@/app/candidates/actions';
import QuickAddGameModal from './QuickAddGameModal';

const SCAN_COOLDOWN_KEY = 'live-candidates:last-scan';
const SCAN_COOLDOWN_MS = 60_000;

function liveTitleOf(c: ScheduleCandidateView) {
  return c.title?.trim() || `${c.streamerName} 라이브`;
}

function defaultSelectedIds(c: ScheduleCandidateView): string[] {
  return [
    c.streamerId,
    ...c.suggestedParticipants.map((p) => p.id),
  ].filter((id, i, arr) => arr.indexOf(id) === i);
}

function formatFreshnessLabel(iso: string | null): string {
  if (!iso) return '갱신 기록 없음';
  const mins = Math.max(
    0,
    Math.floor((Date.now() - new Date(iso).getTime()) / 60_000),
  );
  if (mins < 1) return '방금 갱신';
  if (mins < 60) return `${mins}분 전 갱신`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전 갱신`;
  return format(new Date(iso), 'M/d HH:mm', { locale: ko });
}

function canScanNow(): boolean {
  try {
    const raw = localStorage.getItem(SCAN_COOLDOWN_KEY);
    if (!raw) return true;
    return Date.now() - Number(raw) >= SCAN_COOLDOWN_MS;
  } catch {
    return true;
  }
}

function markScanned() {
  try {
    localStorage.setItem(SCAN_COOLDOWN_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

const fieldClass =
  'w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-400/15 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100';

const listVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.055, delayChildren: 0.04 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 380, damping: 28 },
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    y: -8,
    filter: 'blur(4px)',
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] as const },
  },
};

export default function LiveCandidateRegisterTab({
  games: gamesProp,
  onRegistered,
}: {
  games: { id: string; title: string }[];
  onRegistered?: () => void;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<ScheduleCandidateView[]>([]);
  const [games, setGames] = useState(gamesProp);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<'ok' | 'err'>('ok');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [freshnessAt, setFreshnessAt] = useState<string | null>(null);
  const [freshnessTick, setFreshnessTick] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [draftTitles, setDraftTitles] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Record<string, string[]>>({});
  const [gameIds, setGameIds] = useState<Record<string, string>>({});
  const [addGameFor, setAddGameFor] = useState<{
    candidateId: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    setGames(gamesProp);
  }, [gamesProp]);

  useEffect(() => {
    const id = window.setInterval(() => setFreshnessTick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const applyPayload = useCallback(
    (data: {
      candidates: ScheduleCandidateView[];
      freshnessAt: string | null;
    }) => {
      setCandidates(data.candidates);
      setFreshnessAt(data.freshnessAt);
    },
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listPendingLiveCandidatesAction();
    setLoading(false);
    if (!res.success) {
      setMessageTone('err');
      setMessage(res.error ?? '후보를 불러오지 못함');
      setCandidates([]);
      setFreshnessAt(null);
      return;
    }
    applyPayload(res.data);
  }, [applyPayload]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = (withScan: boolean) => {
    setRefreshing(true);
    setMessage(null);
    startTransition(async () => {
      const shouldScan = withScan && canScanNow();
      const res = await refreshPendingLiveCandidatesAction({
        scan: shouldScan,
      });
      setRefreshing(false);
      if (!res.success) {
        setMessageTone('err');
        setMessage(res.error ?? '새로고침 실패');
        return;
      }
      if (res.data.scanned) markScanned();
      applyPayload(res.data);
      setMessageTone('ok');
      setMessage(
        res.data.scanned
          ? 'LIVE 스캔 후 목록을 갱신함'
          : withScan && !shouldScan
            ? '목록 갱신 (스캔은 1분 뒤에 다시 가능)'
            : '목록 갱신',
      );
    });
  };

  const pendingRows = useMemo(
    () => candidates.filter((c) => c.status === 'PENDING'),
    [candidates],
  );

  const cohortOptions = (c: ScheduleCandidateView) => {
    const fromSuggest = c.suggestedParticipants;
    const fromPending = pendingRows
      .filter((p) => p.dateKst === c.dateKst && p.streamerId !== c.streamerId)
      .map((p) => ({ id: p.streamerId, name: p.streamerName }));
    const map = new Map<string, { id: string; name: string }>();
    for (const m of [...fromSuggest, ...fromPending]) map.set(m.id, m);
    return [...map.values()];
  };

  const titleFor = (c: ScheduleCandidateView) => draftTitles[c.id] ?? liveTitleOf(c);
  const isEdited = (c: ScheduleCandidateView) =>
    draftTitles[c.id] !== undefined && draftTitles[c.id] !== liveTitleOf(c);
  const participantsFor = (c: ScheduleCandidateView) =>
    selectedIds[c.id] ?? defaultSelectedIds(c);
  const gameFor = (c: ScheduleCandidateView) =>
    gameIds[c.id] !== undefined ? gameIds[c.id] : (c.suggestedGameId ?? '');

  const toggleParticipant = (c: ScheduleCandidateView, pid: string) => {
    if (pid === c.streamerId) return;
    setSelectedIds((prev) => {
      const cur = prev[c.id] ?? defaultSelectedIds(c);
      const next = cur.includes(pid) ? cur.filter((id) => id !== pid) : [...cur, pid];
      if (!next.includes(c.streamerId)) next.unshift(c.streamerId);
      return { ...prev, [c.id]: next };
    });
  };

  const clearLocal = (id: string) => {
    setDraftTitles((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setSelectedIds((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setGameIds((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const register = (id: string, c: ScheduleCandidateView) => {
    const title = titleFor(c).trim();
    if (!title) {
      setMessageTone('err');
      setMessage('일정 제목을 입력해 주세요.');
      return;
    }
    const participantIds = participantsFor(c);
    const gameId = gameFor(c) || null;
    setBusyId(id);
    setMessage(null);
    startTransition(async () => {
      const res = await registerLiveCandidateAction(id, title, participantIds, gameId);
      setBusyId(null);
      if (!res.success) {
        setMessageTone('err');
        setMessage(res.error ?? '등록 실패');
        await load();
        return;
      }
      clearLocal(id);
      setCandidates((prev) => prev.filter((row) => row.id !== id));
      setMessageTone('ok');
      setMessage('등록 완료');
      await load();
      router.refresh();
      onRegistered?.();
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="relative shrink-0 overflow-hidden border-b border-slate-100 px-6 py-3 dark:border-slate-700 md:px-8">
        {!reduceMotion && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -left-8 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-rose-400/20 blur-2xl dark:bg-rose-500/15"
            animate={{ opacity: [0.35, 0.7, 0.35], scale: [0.9, 1.15, 0.9] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2 shrink-0">
                {!reduceMotion && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
                )}
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
              </span>
              <p className="truncate text-xs font-bold text-slate-500 dark:text-slate-400">
                일정 없는 LIVE · 감지 시각으로 등록
              </p>
            </div>
            <p className="pl-4 text-[10px] font-semibold text-slate-400" key={freshnessTick}>
              {formatFreshnessLabel(freshnessAt)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              disabled={refreshing || pending}
              onClick={() => refresh(true)}
              title="목록 새로고침 (1분에 한 번 LIVE 스캔)"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-black text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${refreshing || pending ? 'animate-spin' : ''}`}
              />
              새로고침
            </button>
            <AnimatePresence mode="popLayout">
              {!loading && (
                <motion.span
                  key={pendingRows.length}
                  initial={reduceMotion ? false : { scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-black text-rose-600 dark:bg-rose-950/50 dark:text-rose-300"
                >
                  {pendingRows.length}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            key={message}
            initial={reduceMotion ? false : { opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="shrink-0 overflow-hidden px-6 pt-3 md:px-8"
          >
            <p
              className={`rounded-xl px-3 py-2 text-xs font-bold ${
                messageTone === 'err'
                  ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              }`}
            >
              {message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 md:px-8">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 py-16 text-sm font-bold text-slate-400"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              불러오는 중…
            </motion.div>
          ) : pendingRows.length === 0 ? (
            <motion.div
              key="empty"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-3 py-16 text-center"
            >
              <motion.div
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800"
                animate={
                  reduceMotion
                    ? undefined
                    : { y: [0, -4, 0], rotate: [0, -4, 4, 0] }
                }
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Radio className="h-5 w-5" />
              </motion.div>
              <div>
                <p className="text-sm font-black text-slate-500 dark:text-slate-400">
                  등록할 LIVE가 없어요
                </p>
                <p className="mt-1 text-xs font-bold text-slate-400">
                  크론이 쌓아주면 여기에 나타납니다
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.ul
              key="list"
              variants={reduceMotion ? undefined : listVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3 pb-2"
            >
              <AnimatePresence mode="popLayout">
                {pendingRows.map((c) => {
                  const liveTitle = liveTitleOf(c);
                  const edited = isEdited(c);
                  const selected = participantsFor(c);
                  const options = cohortOptions(c);
                  const needsGameAdd =
                    Boolean(c.liveCategory?.trim()) &&
                    !c.suggestedGameId &&
                    !gameFor(c);
                  const busy = pending && busyId === c.id;

                  return (
                    <motion.li
                      key={c.id}
                      layout={!reduceMotion}
                      variants={reduceMotion ? undefined : cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      whileHover={
                        reduceMotion
                          ? undefined
                          : { y: -2, transition: { duration: 0.15 } }
                      }
                      className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/80"
                    >
                      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-rose-500 via-rose-400 to-amber-400" />
                      <div className="flex items-center gap-3 border-b border-slate-100 py-3 pr-4 pl-5 dark:border-slate-700/80">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-[15px] font-black text-slate-900 dark:text-white">
                              {c.streamerName}
                            </span>
                            {c.suggestedParticipants.length > 0 && (
                              <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-600 dark:bg-violet-950/40 dark:text-violet-300">
                                합방 {c.suggestedParticipants.length}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                            {format(new Date(c.detectedAt), 'M/d HH:mm', { locale: ko })}
                            {c.liveCategory ? ` · ${c.liveCategory}` : ''}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {c.liveUrl && (
                            <a
                              href={c.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                              title="방송 열기"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          <motion.button
                            type="button"
                            disabled={busy}
                            onClick={() => register(c.id, c)}
                            whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-black text-white shadow-sm shadow-emerald-600/25 hover:bg-emerald-500 disabled:opacity-50"
                          >
                            {busy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            등록
                          </motion.button>
                        </div>
                      </div>

                      <div className="space-y-3 px-4 py-3 pl-5">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={titleFor(c)}
                            onChange={(e) =>
                              setDraftTitles((prev) => ({
                                ...prev,
                                [c.id]: e.target.value,
                              }))
                            }
                            className={`min-w-0 flex-1 ${fieldClass}`}
                            placeholder={`${c.streamerName} 라이브`}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setDraftTitles((prev) => {
                                const next = { ...prev };
                                delete next[c.id];
                                return next;
                              })
                            }
                            disabled={!edited}
                            className="rounded-xl px-2.5 text-slate-400 hover:bg-slate-100 disabled:opacity-25 dark:hover:bg-slate-700"
                            title="방송 제목으로 되돌리기"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <select
                            value={gameFor(c)}
                            onChange={(e) =>
                              setGameIds((prev) => ({
                                ...prev,
                                [c.id]: e.target.value,
                              }))
                            }
                            className={`min-w-0 flex-1 ${fieldClass}`}
                          >
                            <option value="">게임 선택 안 함</option>
                            {games.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.title}
                                {c.suggestedGameId === g.id ? ' · 추정' : ''}
                              </option>
                            ))}
                          </select>
                          {needsGameAdd && (
                            <motion.button
                              type="button"
                              onClick={() =>
                                setAddGameFor({
                                  candidateId: c.id,
                                  title: c.liveCategory!.trim(),
                                })
                              }
                              whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                              className="inline-flex shrink-0 items-center justify-center gap-1 rounded-xl border border-dashed border-amber-300 bg-amber-50/80 px-3 py-2 text-[11px] font-black text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              게임 추가
                            </motion.button>
                          )}
                        </div>

                        {(options.length > 0 || selected.length > 1) && (
                          <div className="flex flex-wrap gap-1.5">
                            <span className="inline-flex items-center rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white dark:bg-slate-100 dark:text-slate-900">
                              {c.streamerName}
                            </span>
                            {options.map((m) => {
                              const on = selected.includes(m.id);
                              return (
                                <motion.button
                                  key={m.id}
                                  type="button"
                                  onClick={() => toggleParticipant(c, m.id)}
                                  layout={!reduceMotion}
                                  whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
                                    on
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                                  }`}
                                >
                                  {m.name}
                                </motion.button>
                              );
                            })}
                          </div>
                        )}

                        {edited && (
                          <p className="truncate text-[11px] font-semibold text-slate-400">
                            원제 {liveTitle}
                          </p>
                        )}
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {addGameFor && (
          <QuickAddGameModal
            initialTitle={addGameFor.title}
            onClose={() => setAddGameFor(null)}
            onCreated={(game) => {
              setGames((prev) =>
                prev.some((g) => g.id === game.id)
                  ? prev
                  : [...prev, game].sort((a, b) =>
                      a.title.localeCompare(b.title, 'ko'),
                    ),
              );
              setGameIds((prev) => ({
                ...prev,
                [addGameFor.candidateId]: game.id,
              }));
              setCandidates((prev) =>
                prev.map((row) =>
                  row.id === addGameFor.candidateId
                    ? { ...row, suggestedGameId: game.id }
                    : row,
                ),
              );
              setMessageTone('ok');
            setMessage(`「${game.title}」 추가됨`);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
