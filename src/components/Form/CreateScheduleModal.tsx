// src/components/calendar/ScheduleFormModal.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import {
  X,
  Calendar as CalendarIcon,
  AlertCircle,
  Link as LinkIcon,
  WifiOff,
  Sparkles,
  Loader2,
  CheckCircle2,
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { createScheduleAction, updateScheduleAction } from '@/app/actions';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { backdropVariants, smoothModalVariants } from '@/lib/modalVariants';
import { ModalProps } from '@/types/props';
import { Streamer, Game } from '@prisma/client';
import { FlattenedSchedule } from '@/lib/schedule-formatters';
import StreamerSelector from './StreamerSelctor';
import { matchChzzkCategory } from '@/constants/chzzkGameMap';
import ScheduleExtractTab from './ScheduleExtractTab';

// ── Schemas ────────────────────────────────────────────────────────────────

const slotSchema = z.object({
  title: z.string().min(1, '방송 제목을 입력해주세요.'),
  startTime: z.string().min(1, '시작 시간을 선택해주세요.'),
  streamerIds: z
    .array(z.string())
    .min(1, '참여 멤버를 최소 1명 이상 선택해주세요.'),
});

const editSchema = z.object({
  title: z.string().min(1, '방송 제목을 입력해주세요.'),
  startTime: z.string().min(1, '시작 시간을 선택해주세요.'),
  streamerIds: z
    .array(z.string())
    .min(1, '참여 멤버를 최소 1명 이상 선택해주세요.'),
});

// ── Types ──────────────────────────────────────────────────────────────────

type SlotErrors = Partial<
  Record<'title' | 'startTime' | 'streamerIds', string>
>;

type SlotEntry = {
  key: string;
  title: string;
  startTime: string;
  selectedGameId: string;
  selectedStreamerIds: string[];
  liveUrls: string[];
  isTimeTBD: boolean;
  metaLoading: boolean;
  autoFilled: string[];
  errors: SlotErrors;
};

type EditErrors = Partial<
  Record<keyof z.infer<typeof editSchema> | 'submit', string>
>;
type ParticipantEntry = { id: string; nation: string; result: string };

type AutoFillResult = {
  title: string | null;
  category: string | null;
  channelName: string | null;
  matchedStreamerId: string | null;
  matchedStreamerName: string | null;
};

type CreateScheduleModalProps = ModalProps & {
  streamers: Streamer[];
  games: Game[];
  initialData?: FlattenedSchedule | null;
  isEdit?: boolean;
  onOptimisticCreate?: (schedule: FlattenedSchedule) => void;
};

function createSlot(): SlotEntry {
  return {
    key: crypto.randomUUID(),
    title: '',
    startTime: '',
    selectedGameId: '',
    selectedStreamerIds: [],
    liveUrls: [''],
    isTimeTBD: false,
    metaLoading: false,
    autoFilled: [],
    errors: {},
  };
}

function formatSlotPreview(slot: SlotEntry): string {
  const parts: string[] = [];
  if (slot.startTime) {
    try {
      const d = new Date(
        slot.startTime.includes('T')
          ? slot.startTime
          : slot.startTime + 'T00:00',
      );
      parts.push(
        format(d, slot.isTimeTBD ? 'M/d' : 'M/d HH:mm', { locale: ko }),
      );
    } catch {
      /* ignore */
    }
  }
  if (slot.selectedStreamerIds.length > 0)
    parts.push(`${slot.selectedStreamerIds.length}명`);
  return parts.join(' · ');
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ScheduleFormModal({
  streamers,
  games,
  onClose,
  initialData,
  isEdit = false,
  onOptimisticCreate,
}: CreateScheduleModalProps) {
  // ── Edit mode state ───────────────────────────────────────────────────────
  const defaultTime = initialData?.startTime
    ? format(new Date(initialData.startTime), "yyyy-MM-dd'T'HH:mm")
    : '';
  const [title, setTitle] = useState(initialData?.title || '');
  const [startTime, setStartTime] = useState(defaultTime);
  const [selectedGameId, setSelectedGameId] = useState(
    initialData?.gameId || '',
  );
  const [participants, setParticipants] = useState<ParticipantEntry[]>(
    initialData?.participants?.map((p) => ({
      id: p.id,
      nation: p.nation ?? '',
      result: p.result ?? '',
    })) || [],
  );
  const [liveUrls, setLiveUrls] = useState<string[]>(
    initialData?.liveUrls?.length ? initialData.liveUrls : [''],
  );
  const [isTimeTBD, setIsTimeTBD] = useState(initialData?.isGuerrilla || false);
  const [isNaeJeon, setIsNaeJeon] = useState(initialData?.isNaeJeon || false);
  const [isLiveEnded, setIsLiveEnded] = useState(
    initialData?.isLiveEnded || false,
  );
  const [editErrors, setEditErrors] = useState<EditErrors>({});
  const [editMetaLoading, setEditMetaLoading] = useState(false);
  const [editAutoFilled, setEditAutoFilled] = useState<string[]>([]);

  // ── Create mode state ─────────────────────────────────────────────────────
  const firstKeyRef = useRef(crypto.randomUUID());
  const [slots, setSlots] = useState<SlotEntry[]>(() => [
    { ...createSlot(), key: firstKeyRef.current },
  ]);
  const [expandedKey, setExpandedKey] = useState<string | null>(
    firstKeyRef.current,
  );
  const [batchSubmitError, setBatchSubmitError] = useState<string | null>(null);
  const [createMode, setCreateMode] = useState<'single' | 'batch' | 'image' | 'text'>('single');

  // ── Shared state ──────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  useEscapeKey(onClose);

  const sortedStreamers = [...streamers].sort((a, b) =>
    a.name.localeCompare(b.name, 'ko-KR'),
  );

  // ── Edit mode derived ─────────────────────────────────────────────────────
  const selectedStreamers = participants.map((p) => p.id);
  const isHoi4Game =
    games.find((g) => g.id === selectedGameId)?.isHoi4 ||
    (initialData?.gameId === selectedGameId && initialData?.game?.isHoi4) ||
    false;

  // ── Edit mode handlers ────────────────────────────────────────────────────
  const toggleStreamer = (id: string) => {
    setParticipants((prev) =>
      prev.some((p) => p.id === id)
        ? prev.filter((p) => p.id !== id)
        : [...prev, { id, nation: '', result: '' }],
    );
    if (editErrors.streamerIds)
      setEditErrors((e) => ({ ...e, streamerIds: undefined }));
  };

  const updateParticipant = (
    id: string,
    field: 'nation' | 'result',
    value: string,
  ) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  const handleLiveUrlBlur = useCallback(async (urlIndex: number) => {
    const trimmed = liveUrls[urlIndex]?.trim();
    if (!trimmed || !trimmed.includes('chzzk.naver.com')) return;
    setEditMetaLoading(true);
    setEditAutoFilled([]);
    try {
      const res = await fetch(
        `/api/chzzk/live-meta?url=${encodeURIComponent(trimmed)}`,
      );
      if (!res.ok) return;
      const data: AutoFillResult = await res.json();
      const filled: string[] = [];
      if (data.title && !title.trim()) {
        setTitle(data.title);
        filled.push('제목');
      }
      if (data.category && !selectedGameId) {
        const gameId = matchChzzkCategory(data.category);
        if (gameId) {
          const matched = games.find((g) => g.id === gameId);
          if (matched) {
            setSelectedGameId(matched.id);
            filled.push(`게임 (${matched.title})`);
          }
        }
      }
      if (
        data.matchedStreamerId &&
        !selectedStreamers.includes(data.matchedStreamerId)
      ) {
        setParticipants((prev) => [
          ...prev,
          { id: data.matchedStreamerId!, nation: '', result: '' },
        ]);
        filled.push(`멤버 (${data.matchedStreamerName})`);
      }
      setEditAutoFilled(filled);
    } catch {
      /* silent */
    } finally {
      setEditMetaLoading(false);
    }
  }, [liveUrls, title, selectedGameId, selectedStreamers, games]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = editSchema.safeParse({ title, startTime, streamerIds: selectedStreamers });
    if (!parsed.success) {
      const fieldErrors: EditErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof EditErrors;
        fieldErrors[field] = issue.message;
      }
      setEditErrors(fieldErrors);
      return;
    }
    setEditErrors({});
    setIsSubmitting(true);
    const resolvedStartTime = isTimeTBD
      ? new Date(startTime.split('T')[0] + 'T00:00')
      : new Date(startTime);
    const cleanUrls = liveUrls.map((u) => u.trim()).filter(Boolean);
    const payload = {
      title,
      startTime: resolvedStartTime,
      participants: participants.map(({ id, nation, result }) => ({
        id,
        nation: nation.trim() || undefined,
        result: result || undefined,
      })),
      gameId: selectedGameId === '' ? undefined : selectedGameId,
      liveUrls: cleanUrls,
      isGuerrilla: isTimeTBD,
      isNaeJeon: isHoi4Game ? isNaeJeon : false,
      isLiveEnded: isEdit ? isLiveEnded : false,
    };
    const result = isEdit
      ? await updateScheduleAction(initialData!.id, payload)
      : await createScheduleAction(payload);
    if (result.success) {
      if (!isEdit && onOptimisticCreate) {
        const selectedGame = games.find((g) => g.id === selectedGameId) ?? null;
        const flatParticipants = streamers
          .filter((s) => selectedStreamers.includes(s.id))
          .map((s) => {
            const p = participants.find((x) => x.id === s.id);
            return { ...s, nation: p?.nation.trim() || null, result: p?.result || null };
          });
        const startDate = new Date(startTime);
        onOptimisticCreate({
          id: result.data?.id ?? `optimistic-${Date.now()}`,
          title,
          content: null,
          gameId: selectedGameId || null,
          isGuerrilla: isTimeTBD,
          isNaeJeon: isHoi4Game ? isNaeJeon : false,
          isLiveEnded: false,
          liveUrls: cleanUrls,
          startTime: startDate,
          endTime: null,
          createdAt: new Date(),
          participants: flatParticipants,
          game: selectedGame,
          formattedDate: format(startDate, 'yyyy년 MM월 dd일(EEEE)', { locale: ko }),
          formattedTime: format(startDate, 'HH:mm'),
        });
      }
      onClose();
    } else {
      setEditErrors({ submit: '일정 저장에 실패했습니다. 다시 시도해주세요.' });
    }
    setIsSubmitting(false);
  };

  // ── Create mode handlers ──────────────────────────────────────────────────
  const updateSlot = useCallback((key: string, updates: Partial<SlotEntry>) => {
    setSlots((prev) =>
      prev.map((s) => (s.key === key ? { ...s, ...updates } : s)),
    );
  }, []);

  const addSlot = useCallback(() => {
    const next = createSlot();
    setSlots((prev) => [...prev, next]);
    setExpandedKey(next.key);
  }, []);

  const removeSlot = useCallback((key: string) => {
    setSlots((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((s) => s.key !== key);
      return next;
    });
    setExpandedKey((prev) => (prev === key ? null : prev));
  }, []);

  const handleSlotLiveUrlBlur = useCallback(
    async (
      key: string,
      url: string,
      slotTitle: string,
      slotGameId: string,
      slotStreamerIds: string[],
    ) => {
      const trimmed = url.trim();
      if (!trimmed || !trimmed.includes('chzzk.naver.com')) return;
      setSlots((prev) =>
        prev.map((s) =>
          s.key === key ? { ...s, metaLoading: true, autoFilled: [] } : s,
        ),
      );
      try {
        const res = await fetch(
          `/api/chzzk/live-meta?url=${encodeURIComponent(trimmed)}`,
        );
        if (!res.ok) return;
        const data: AutoFillResult = await res.json();
        const filled: string[] = [];
        const updates: Partial<SlotEntry> = {};
        if (data.title && !slotTitle.trim()) {
          updates.title = data.title;
          filled.push('제목');
        }
        if (data.category && !slotGameId) {
          const gameId = matchChzzkCategory(data.category);
          if (gameId) {
            const matched = games.find((g) => g.id === gameId);
            if (matched) {
              updates.selectedGameId = matched.id;
              filled.push(`게임 (${matched.title})`);
            }
          }
        }
        if (
          data.matchedStreamerId &&
          !slotStreamerIds.includes(data.matchedStreamerId)
        ) {
          updates.selectedStreamerIds = [
            ...slotStreamerIds,
            data.matchedStreamerId,
          ];
          filled.push(`멤버 (${data.matchedStreamerName})`);
        }
        updates.autoFilled = filled;
        setSlots((prev) =>
          prev.map((s) =>
            s.key === key ? { ...s, ...updates, metaLoading: false } : s,
          ),
        );
      } catch {
        setSlots((prev) =>
          prev.map((s) => (s.key === key ? { ...s, metaLoading: false } : s)),
        );
      }
    },
    [games],
  );

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBatchSubmitError(null);

    // Validate all slots
    let firstErrorKey: string | null = null;
    const validated = slots.map((slot) => {
      const result = slotSchema.safeParse({
        title: slot.title,
        startTime: slot.startTime,
        streamerIds: slot.selectedStreamerIds,
      });
      if (!result.success) {
        const errors: SlotErrors = {};
        for (const issue of result.error.issues) {
          const field = issue.path[0] as keyof SlotErrors;
          errors[field] = issue.message;
        }
        if (!firstErrorKey) firstErrorKey = slot.key;
        return { ...slot, errors };
      }
      return { ...slot, errors: {} };
    });
    setSlots(validated);
    if (firstErrorKey) {
      setExpandedKey(firstErrorKey);
      return;
    }

    setIsSubmitting(true);
    const results = await Promise.allSettled(
      slots.map((slot) =>
        createScheduleAction({
          title: slot.title,
          startTime: slot.isTimeTBD
            ? new Date(slot.startTime.split('T')[0] + 'T00:00')
            : new Date(slot.startTime),
          participants: slot.selectedStreamerIds.map((id) => ({ id })),
          gameId: slot.selectedGameId || undefined,
          liveUrls: slot.liveUrls.map((u) => u.trim()).filter(Boolean),
          isGuerrilla: slot.isTimeTBD,
          isNaeJeon: false,
        }),
      ),
    );
    const failCount = results.filter(
      (r) =>
        r.status === 'rejected' ||
        (r.status === 'fulfilled' && !r.value.success),
    ).length;
    if (failCount === 0) {
      onClose();
    } else {
      setBatchSubmitError(
        `${failCount}개 일정 등록에 실패했습니다. 다시 시도해주세요.`,
      );
    }
    setIsSubmitting(false);
  };

  // ── Modal wrapper (shared) ────────────────────────────────────────────────
  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={backdropVariants}
        className="fixed inset-0 z-70 flex items-center justify-center p-4 md:p-6 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          variants={smoothModalVariants}
          className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl dark:shadow-slate-900/50 flex flex-col max-h-[90dvh] border border-slate-100 dark:border-slate-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="p-6 md:p-8 border-b border-slate-50 dark:border-slate-700 flex justify-between items-start shrink-0 bg-slate-50/50 dark:bg-slate-700/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                  {isEdit ? 'Edit Schedule' : 'New Schedule'}
                </p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  {isEdit
                    ? '일정 수정'
                    : createMode === 'batch' && slots.length > 1
                      ? `일정 ${slots.length}개 등록`
                      : '새 일정 등록'}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          {/* ── 모드 탭 (등록 시에만) ── */}
          {!isEdit && (
            <div className="px-6 md:px-8 pt-4 pb-0 shrink-0">
              <div className="flex bg-slate-100 dark:bg-slate-700/60 rounded-2xl p-1 gap-1">
                {([
                  { key: 'single', label: '단일 등록' },
                  { key: 'batch',  label: '일괄 등록' },
                  { key: 'image',  label: '이미지' },
                  { key: 'text',   label: '텍스트' },
                ] as const).map(({ key, label }) => (
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
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* SINGLE / EDIT MODE                                         */}
          {/* ══════════════════════════════════════════════════════════ */}
          {isEdit || createMode === 'single' ? (
            <>
              <form
                id="schedule-form"
                onSubmit={handleEditSubmit}
                noValidate
                className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto"
              >
                {/* 방송 링크 */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                      방송 링크
                      <span className="ml-1.5 normal-case font-medium text-indigo-400 dark:text-indigo-500">
                        · 치지직 URL 입력 시 자동 채우기
                      </span>
                    </label>
                    {editMetaLoading && <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />}
                    {!editMetaLoading && editAutoFilled.length > 0 && <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <div className="space-y-2">
                    {liveUrls.map((url, i) => (
                      <div key={i} className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => {
                            setLiveUrls((prev) => prev.map((u, idx) => idx === i ? e.target.value : u));
                            if (editAutoFilled.length) setEditAutoFilled([]);
                          }}
                          onBlur={() => handleLiveUrlBlur(i)}
                          placeholder="https://chzzk.naver.com/live/..."
                          className="w-full pl-9 pr-9 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                        />
                        {liveUrls.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setLiveUrls((prev) => prev.filter((_, idx) => idx !== i))}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-300 dark:text-slate-600 hover:text-red-400 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setLiveUrls((prev) => [...prev, ''])}
                    className="mt-2 flex items-center gap-1.5 text-xs font-bold text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    URL 추가
                  </button>
                  <AnimatePresence>
                    {editAutoFilled.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          자동 입력됨: {editAutoFilled.join(' · ')}
                        </p>
                        <button
                          type="button"
                          onClick={() => setEditAutoFilled([])}
                          className="ml-auto text-indigo-300 hover:text-indigo-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 제목 */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                    방송 제목
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (editErrors.title)
                        setEditErrors((er) => ({ ...er, title: undefined }));
                    }}
                    placeholder="예) 문명 6 합방"
                    className={`w-full px-4 py-4 bg-slate-50 dark:bg-slate-700 border rounded-xl text-base font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all ${editErrors.title ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
                  />
                  {editErrors.title && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-500">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {editErrors.title}
                    </p>
                  )}
                </div>

                {/* 게임 */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                    플레이 게임 (선택)
                  </label>
                  <select
                    value={selectedGameId}
                    onChange={(e) => setSelectedGameId(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500/50 outline-none text-slate-700 dark:text-slate-200 transition-all"
                  >
                    <option value="">선택 안 함</option>
                    {games.map((game) => (
                      <option key={game.id} value={game.id}>
                        {game.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 시작 시간 */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                      시작 시간
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isTimeTBD}
                        onChange={(e) => setIsTimeTBD(e.target.checked)}
                        className="w-3.5 h-3.5 rounded accent-indigo-600"
                      />
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                        시간 미정
                      </span>
                    </label>
                  </div>
                  <input
                    type={isTimeTBD ? 'date' : 'datetime-local'}
                    value={isTimeTBD ? startTime.split('T')[0] : startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      if (editErrors.startTime)
                        setEditErrors((er) => ({
                          ...er,
                          startTime: undefined,
                        }));
                    }}
                    className={`w-full p-3 bg-slate-50 dark:bg-slate-700 border rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all scheme-light dark:scheme-dark ${editErrors.startTime ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
                  />
                  {editErrors.startTime && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-500">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {editErrors.startTime}
                    </p>
                  )}
                </div>

                {/* 라이브 강제 종료 (수정 모드 전용) */}
                {isEdit && (
                  <div
                    className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl border transition-colors ${isLiveEnded ? 'bg-orange-50 dark:bg-orange-900/15 border-orange-200 dark:border-orange-800' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'}`}
                  >
                    <WifiOff
                      className={`w-4 h-4 mt-0.5 shrink-0 ${isLiveEnded ? 'text-orange-500 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'}`}
                    />
                    <div className="flex-1 min-w-0">
                      <label className="flex items-center justify-between gap-2 cursor-pointer">
                        <div>
                          <p
                            className={`text-sm font-bold ${isLiveEnded ? 'text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-300'}`}
                          >
                            라이브 강제 종료
                          </p>
                          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                            체크 시 자동 감지를 무시하고 라이브 뱃지를 숨깁니다
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={isLiveEnded}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const ok = confirm(
                                '⚠️ 라이브 강제 종료\n\n체크 시 자동 감지를 무시하고 라이브 뱃지를 강제로 숨깁니다.\n방송이 실제로 종료됐을 때만 사용해주세요.\n\n계속하시겠습니까?',
                              );
                              if (!ok) return;
                            }
                            setIsLiveEnded(e.target.checked);
                          }}
                          className="w-4 h-4 rounded accent-orange-500 shrink-0"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* 참여 멤버 */}
                <div className="relative" ref={dropdownRef}>
                  <div className="border-t border-slate-100 dark:border-slate-700 pt-8 space-y-4">
                    <div className="flex justify-between items-end px-2">
                      <label className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                        참여 멤버 선택{' '}
                        <span className="text-indigo-500 ml-1">
                          ({selectedStreamers.length})
                        </span>
                      </label>
                    </div>
                    {editErrors.streamerIds && (
                      <p className="flex items-center gap-1 text-xs font-bold text-red-500 px-2">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {editErrors.streamerIds}
                      </p>
                    )}
                    <StreamerSelector
                      streamers={sortedStreamers}
                      selectedStreamers={selectedStreamers}
                      toggleStreamer={toggleStreamer}
                    />
                  </div>
                </div>

                {/* HOI4 내전 */}
                {isHoi4Game && (
                  <label className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/50 rounded-2xl cursor-pointer">
                    <div>
                      <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                        내전 세션
                      </p>
                      <p className="text-xs font-medium text-amber-500 dark:text-amber-600 mt-0.5">
                        체크 시 HOI4 참전 기록 페이지에 집계됩니다
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isNaeJeon}
                      onChange={(e) => setIsNaeJeon(e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-500 shrink-0"
                    />
                  </label>
                )}

                {/* HOI4 국가 */}
                {isHoi4Game && participants.length > 0 && (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                      HOI4 · 국가
                    </label>
                    <div className="space-y-2">
                      {participants.map(({ id, nation }) => {
                        const streamer = streamers.find((s) => s.id === id);
                        if (!streamer) return null;
                        return (
                          <div
                            key={id}
                            className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                          >
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 w-16 shrink-0 truncate">
                              {streamer.name}
                            </span>
                            <input
                              type="text"
                              value={nation}
                              onChange={(e) =>
                                updateParticipant(id, 'nation', e.target.value)
                              }
                              placeholder="국가명"
                              className="flex-1 min-w-0 px-2.5 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/40"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </form>

              {/* Edit footer */}
              <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-800 flex flex-col gap-3 border-t border-slate-100 dark:border-slate-700 shrink-0">
                {editErrors.submit && (
                  <p className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {editErrors.submit}
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-4 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    form="schedule-form"
                    type="submit"
                    disabled={isSubmitting || editMetaLoading}
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    {editMetaLoading
                      ? '정보 가져오는 중...'
                      : isSubmitting
                        ? '저장 중...'
                        : isEdit
                          ? '수정 완료'
                          : '일정 등록'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* ══════════════════════════════════════════════════════════ */
            /* CREATE MODE (BATCH)                                        */
            /* ══════════════════════════════════════════════════════════ */
            <>
              <form
                id="batch-create-form"
                onSubmit={handleBatchSubmit}
                noValidate
                className="flex-1 overflow-y-auto min-h-0"
              >
                <div className="p-4 md:p-6 space-y-3">
                  {slots.map((slot, index) => {
                    const isExpanded = expandedKey === slot.key;
                    const hasErrors = Object.keys(slot.errors).length > 0;
                    const preview = formatSlotPreview(slot);

                    return (
                      <div
                        key={slot.key}
                        className={`rounded-2xl border transition-all ${
                          hasErrors
                            ? 'border-red-300 dark:border-red-700'
                            : isExpanded
                              ? 'border-indigo-200 dark:border-indigo-700 shadow-md shadow-indigo-50 dark:shadow-indigo-950/30'
                              : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {/* Slot header */}
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedKey(isExpanded ? null : slot.key)
                          }
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span
                            className={`text-sm font-black shrink-0 ${isExpanded ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'}`}
                          >
                            일정 {index + 1}
                          </span>
                          {!isExpanded && (
                            <span className="text-sm text-slate-500 dark:text-slate-400 truncate flex-1 font-medium">
                              {slot.title ? (
                                <>
                                  <span className="font-bold text-slate-700 dark:text-slate-200">
                                    {slot.title}
                                  </span>
                                  {preview && (
                                    <span className="ml-2 text-slate-400 dark:text-slate-500 text-xs">
                                      {preview}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500 italic">
                                  미입력
                                </span>
                              )}
                            </span>
                          )}
                          {isExpanded && <span className="flex-1" />}
                          {hasErrors && !isExpanded && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                          )}
                          {slots.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSlot(slot.key);
                              }}
                              className="p-1 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </button>

                        {/* Slot body */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-5 pt-1 space-y-4 border-t border-slate-100 dark:border-slate-700">
                                {/* 방송 링크 */}
                                <div className="pt-3">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                                      방송 링크
                                      <span className="ml-1.5 normal-case font-medium text-indigo-400 dark:text-indigo-500">
                                        · 치지직 URL 자동 채우기
                                      </span>
                                    </label>
                                    {slot.metaLoading && <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />}
                                    {!slot.metaLoading && slot.autoFilled.length > 0 && <Sparkles className="w-3 h-3 text-indigo-400" />}
                                  </div>
                                  <div className="space-y-1.5">
                                    {slot.liveUrls.map((url, urlIdx) => (
                                      <div key={urlIdx} className="relative">
                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                        <input
                                          type="text"
                                          value={url}
                                          onChange={(e) =>
                                            updateSlot(slot.key, {
                                              liveUrls: slot.liveUrls.map((u, i) => i === urlIdx ? e.target.value : u),
                                              autoFilled: [],
                                            })
                                          }
                                          onBlur={() =>
                                            handleSlotLiveUrlBlur(
                                              slot.key,
                                              url,
                                              slot.title,
                                              slot.selectedGameId,
                                              slot.selectedStreamerIds,
                                            )
                                          }
                                          placeholder="https://chzzk.naver.com/live/..."
                                          className="w-full pl-8 pr-8 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                                        />
                                        {slot.liveUrls.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              updateSlot(slot.key, {
                                                liveUrls: slot.liveUrls.filter((_, i) => i !== urlIdx),
                                              })
                                            }
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-300 dark:text-slate-600 hover:text-red-400 transition-colors"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => updateSlot(slot.key, { liveUrls: [...slot.liveUrls, ''] })}
                                    className="mt-1.5 flex items-center gap-1 text-xs font-bold text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                                  >
                                    <Plus className="w-3 h-3" />
                                    URL 추가
                                  </button>
                                  <AnimatePresence>
                                    {slot.autoFilled.length > 0 && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                        className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800"
                                      >
                                        <CheckCircle2 className="w-3 h-3 text-indigo-500 shrink-0" />
                                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                          자동 입력: {slot.autoFilled.join(' · ')}
                                        </p>
                                        <button
                                          type="button"
                                          onClick={() => updateSlot(slot.key, { autoFilled: [] })}
                                          className="ml-auto text-indigo-300 hover:text-indigo-500 transition-colors"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>

                                {/* 제목 */}
                                <div>
                                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                                    방송 제목
                                  </label>
                                  <input
                                    type="text"
                                    value={slot.title}
                                    onChange={(e) =>
                                      updateSlot(slot.key, {
                                        title: e.target.value,
                                        errors: {
                                          ...slot.errors,
                                          title: undefined,
                                        },
                                      })
                                    }
                                    placeholder="예) 문명 6 합방"
                                    className={`w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-base font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all ${slot.errors.title ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
                                  />
                                  {slot.errors.title && (
                                    <p className="mt-1 flex items-center gap-1 text-xs font-bold text-red-500">
                                      <AlertCircle className="w-3 h-3 shrink-0" />
                                      {slot.errors.title}
                                    </p>
                                  )}
                                </div>

                                {/* 게임 */}
                                <div>
                                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                                    플레이 게임 (선택)
                                  </label>
                                  <select
                                    value={slot.selectedGameId}
                                    onChange={(e) =>
                                      updateSlot(slot.key, {
                                        selectedGameId: e.target.value,
                                      })
                                    }
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/50 outline-none text-slate-700 dark:text-slate-200 transition-all"
                                  >
                                    <option value="">선택 안 함</option>
                                    {games.map((game) => (
                                      <option key={game.id} value={game.id}>
                                        {game.title}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* 시작 시간 */}
                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                                      시작 시간
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={slot.isTimeTBD}
                                        onChange={(e) =>
                                          updateSlot(slot.key, {
                                            isTimeTBD: e.target.checked,
                                          })
                                        }
                                        className="w-3.5 h-3.5 rounded accent-indigo-600"
                                      />
                                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                                        시간 미정
                                      </span>
                                    </label>
                                  </div>
                                  <input
                                    type={
                                      slot.isTimeTBD ? 'date' : 'datetime-local'
                                    }
                                    value={
                                      slot.isTimeTBD
                                        ? slot.startTime.split('T')[0]
                                        : slot.startTime
                                    }
                                    onChange={(e) =>
                                      updateSlot(slot.key, {
                                        startTime: e.target.value,
                                        errors: {
                                          ...slot.errors,
                                          startTime: undefined,
                                        },
                                      })
                                    }
                                    className={`w-full p-3 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all scheme-light dark:scheme-dark ${slot.errors.startTime ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
                                  />
                                  {slot.errors.startTime && (
                                    <p className="mt-1 flex items-center gap-1 text-xs font-bold text-red-500">
                                      <AlertCircle className="w-3 h-3 shrink-0" />
                                      {slot.errors.startTime}
                                    </p>
                                  )}
                                </div>

                                {/* 참여 멤버 */}
                                <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-3">
                                  <label className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                                    참여 멤버{' '}
                                    <span className="text-indigo-500">
                                      ({slot.selectedStreamerIds.length})
                                    </span>
                                  </label>
                                  {slot.errors.streamerIds && (
                                    <p className="flex items-center gap-1 text-xs font-bold text-red-500">
                                      <AlertCircle className="w-3 h-3 shrink-0" />
                                      {slot.errors.streamerIds}
                                    </p>
                                  )}
                                  <StreamerSelector
                                    compact
                                    streamers={sortedStreamers}
                                    selectedStreamers={slot.selectedStreamerIds}
                                    toggleStreamer={(id) => {
                                      const has =
                                        slot.selectedStreamerIds.includes(id);
                                      updateSlot(slot.key, {
                                        selectedStreamerIds: has
                                          ? slot.selectedStreamerIds.filter(
                                              (x) => x !== id,
                                            )
                                          : [...slot.selectedStreamerIds, id],
                                        errors: {
                                          ...slot.errors,
                                          streamerIds: undefined,
                                        },
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}

                  {/* Add slot button */}
                  <button
                    type="button"
                    onClick={addSlot}
                    className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-400 dark:text-slate-500 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    일정 추가
                  </button>
                </div>
              </form>

              {/* Batch create footer */}
              <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-800 flex flex-col gap-3 border-t border-slate-100 dark:border-slate-700 shrink-0">
                {batchSubmitError && (
                  <p className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {batchSubmitError}
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-4 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    form="batch-create-form"
                    type="submit"
                    disabled={isSubmitting || slots.some((s) => s.metaLoading)}
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    {isSubmitting
                      ? '등록 중...'
                      : `${slots.length}개 일정 등록`}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* IMAGE / TEXT EXTRACT TABS                                   */}
          {/* ══════════════════════════════════════════════════════════ */}
          {!isEdit && (createMode === 'image' || createMode === 'text') && (
            <ScheduleExtractTab
              key={createMode}
              mode={createMode}
              streamers={streamers}
              games={games}
              onClose={onClose}
            />
          )}
        </motion.div>
      </motion.div>
    </>
  );
}
