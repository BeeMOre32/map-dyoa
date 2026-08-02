'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Check, ExternalLink, Plus, RefreshCw, RotateCcw, X } from 'lucide-react';
import type { ScheduleCandidateView } from '@/lib/schedule-candidate-store';
import {
  approveScheduleCandidateAction,
  dismissScheduleCandidateAction,
  scanScheduleCandidatesAction,
} from '@/app/admin/candidates/actions';
import QuickAddGameModal from '@/components/Form/QuickAddGameModal';

const STATUS_LABEL: Record<ScheduleCandidateView['status'], string> = {
  PENDING: '대기',
  APPROVED: '승인됨',
  DISMISSED: '거절',
};

function liveTitleOf(c: ScheduleCandidateView) {
  return c.title?.trim() || `${c.streamerName} 라이브`;
}

function defaultSelectedIds(c: ScheduleCandidateView): string[] {
  return [
    c.streamerId,
    ...c.suggestedParticipants.map((p) => p.id),
  ].filter((id, i, arr) => arr.indexOf(id) === i);
}

export default function ScheduleCandidateQueue({
  candidates,
  games: gamesProp,
}: {
  candidates: ScheduleCandidateView[];
  games: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [draftTitles, setDraftTitles] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Record<string, string[]>>({});
  /** 선택 게임. undefined = 아직 안 건드림 → suggestedGameId 사용, '' = 선택 안 함 */
  const [gameIds, setGameIds] = useState<Record<string, string>>({});
  const [games, setGames] = useState(gamesProp);
  const [addGameFor, setAddGameFor] = useState<{
    candidateId: string;
    title: string;
  } | null>(null);

  const pendingRows = useMemo(
    () => candidates.filter((c) => c.status === 'PENDING'),
    [candidates],
  );
  const others = useMemo(
    () => candidates.filter((c) => c.status !== 'PENDING'),
    [candidates],
  );

  /** 같은 날 대기 후보 — 칩으로 추가/제거 가능 */
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

  const runScan = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await scanScheduleCandidatesAction();
      if (!res.success) {
        setMessage(res.error ?? '스캔 실패');
        return;
      }
      const d = res.data!;
      setMessage(
        `스캔 완료 (KST ${d.dateKst}): LIVE ${d.liveCount} · 신규 ${d.created} · 갱신 ${d.refreshed} · 일정있음 스킵 ${d.skippedScheduled} · 처리됨 스킵 ${d.skippedResolved}`,
      );
      router.refresh();
    });
  };

  const approve = (id: string, c: ScheduleCandidateView) => {
    const title = titleFor(c).trim();
    if (!title) {
      setMessage('일정 제목을 입력해 주세요.');
      return;
    }
    const participantIds = participantsFor(c);
    const gameId = gameFor(c) || null;
    setBusyId(id);
    setMessage(null);
    startTransition(async () => {
      const res = await approveScheduleCandidateAction(id, title, participantIds, gameId);
      setBusyId(null);
      if (!res.success) {
        setMessage(res.error ?? '승인 실패');
        router.refresh();
        return;
      }
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
      const n = participantIds.length;
      setMessage(
        `일정 등록 (${n}명) → /calendar/schedule/${res.data!.scheduleId}`,
      );
      router.refresh();
    });
  };

  const dismiss = (id: string) => {
    setBusyId(id);
    setMessage(null);
    startTransition(async () => {
      const res = await dismissScheduleCandidateAction(id);
      setBusyId(null);
      if (!res.success) {
        setMessage(res.error ?? '거절 실패');
        return;
      }
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
      setMessage('후보에서 거절 처리함 (오늘 같은 멤버는 다시 안 쌓임)');
      router.refresh();
    });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            일정 후보 큐 <span className="text-rose-500">β</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 text-sm max-w-xl">
            LIVE인데 오늘(KST) 일정이 없는 멤버만 쌓입니다. 제목·합방·게임을 다듬은 뒤
            승인하세요. 시작 시각은 감지 시각입니다.
          </p>
        </div>
        <button
          type="button"
          onClick={runScan}
          disabled={pending}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${pending ? 'animate-spin' : ''}`} />
          지금 스캔
        </button>
      </div>

      {message && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200">
          {message}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-black text-slate-800 dark:text-white">
          대기 {pendingRows.length}건
        </h2>
        {pendingRows.length === 0 ? (
          <p className="text-sm font-bold text-slate-400 py-8 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            대기 후보가 없습니다. 「지금 스캔」으로 테스트해 보세요.
          </p>
        ) : (
          <ul className="space-y-3">
            {pendingRows.map((c) => {
              const liveTitle = liveTitleOf(c);
              const edited = isEdited(c);
              const selected = participantsFor(c);
              const options = cohortOptions(c);
              return (
                <li
                  key={c.id}
                  className="rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {c.streamerName}
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                      {STATUS_LABEL[c.status]}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">{c.dateKst}</span>
                    {c.suggestedParticipants.length > 0 && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                        합방 추정 {c.suggestedParticipants.length}명
                      </span>
                    )}
                    {edited && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300">
                        제목 수정됨
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">
                      일정 제목
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={titleFor(c)}
                        onChange={(e) =>
                          setDraftTitles((prev) => ({ ...prev, [c.id]: e.target.value }))
                        }
                        className="flex-1 min-w-0 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
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
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30"
                        title="방송 제목으로 되돌리기"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                    {edited && (
                      <p className="text-[11px] font-bold text-slate-400 truncate">
                        방송 원제: {liveTitle}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">
                      게임
                      {c.suggestedGameId && gameFor(c) === c.suggestedGameId ? (
                        <span className="ml-1 text-violet-500 normal-case">· 카테고리 추정</span>
                      ) : null}
                    </label>
                    <select
                      value={gameFor(c)}
                      onChange={(e) =>
                        setGameIds((prev) => ({ ...prev, [c.id]: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                    >
                      <option value="">선택 안 함</option>
                      {games.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.title}
                        </option>
                      ))}
                    </select>
                    {c.liveCategory && (
                      <p className="text-[11px] font-bold text-slate-400 truncate">
                        치지직 카테고리: {c.liveCategory}
                      </p>
                    )}
                    {Boolean(c.liveCategory?.trim()) &&
                      !c.suggestedGameId &&
                      !gameFor(c) && (
                      <button
                        type="button"
                        onClick={() =>
                          setAddGameFor({
                            candidateId: c.id,
                            title: c.liveCategory!.trim(),
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-black text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300"
                      >
                        <Plus className="h-3 w-3" />
                        「{c.liveCategory}」 게임으로 등록
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">
                      참가자 ({selected.length}명)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black bg-indigo-600 text-white">
                        {c.streamerName}
                      </span>
                      {options.map((m) => {
                        const on = selected.includes(m.id);
                        const suggested = c.suggestedParticipants.some((s) => s.id === m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => toggleParticipant(c, m.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black transition-colors ${
                              on
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                            title={suggested ? '제목/동시LIVE에서 추정' : '같은 날 LIVE 후보'}
                          >
                            {m.name}
                            {suggested && !on ? ' ·추정' : ''}
                          </button>
                        );
                      })}
                      {options.length === 0 && (
                        <span className="text-[11px] font-bold text-slate-400">
                          합방 추정 없음 (솔로로 등록)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-bold text-slate-400">
                      {c.liveCategory ? `${c.liveCategory} · ` : ''}
                      감지 {format(new Date(c.detectedAt), 'M/d HH:mm', { locale: ko })}
                      {' · '}
                      최근 {format(new Date(c.lastSeenAt), 'HH:mm', { locale: ko })}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      {c.liveUrl && (
                        <a
                          href={c.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-200"
                          title="방송 열기"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        type="button"
                        disabled={pending && busyId === c.id}
                        onClick={() => approve(c.id, c)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        승인
                      </button>
                      <button
                        type="button"
                        disabled={pending && busyId === c.id}
                        onClick={() => dismiss(c.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-black disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        거절
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {others.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-800 dark:text-white">최근 처리</h2>
          <ul className="divide-y divide-slate-100 dark:divide-slate-700 rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
            {others.slice(0, 20).map((c) => (
              <li key={c.id} className="px-5 py-3 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <span className="font-black text-slate-800 dark:text-white">{c.streamerName}</span>
                  <span className="text-slate-400 font-bold"> · {c.title}</span>
                </div>
                <span
                  className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full ${
                    c.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {STATUS_LABEL[c.status]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {addGameFor && (
        <QuickAddGameModal
          initialTitle={addGameFor.title}
          onClose={() => setAddGameFor(null)}
          onCreated={(game) => {
            setGames((prev) =>
              prev.some((g) => g.id === game.id)
                ? prev
                : [...prev, game].sort((a, b) => a.title.localeCompare(b.title, 'ko')),
            );
            setGameIds((prev) => ({ ...prev, [addGameFor.candidateId]: game.id }));
            setMessage(`「${game.title}」 게임을 추가하고 선택함`);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
