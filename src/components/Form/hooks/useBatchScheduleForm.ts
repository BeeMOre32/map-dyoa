import { useState, useCallback, useRef } from 'react';
import { createScheduleAction } from '@/app/actions';
import { matchChzzkCategory } from '@/constants/chzzkGameMap';
import {
  slotSchema,
  SlotEntry,
  SlotErrors,
  AutoFillResult,
} from '../types';

type UseBatchScheduleFormArgs = {
  games: { id: string; title: string }[];
  onClose: () => void;
};

type UseBatchScheduleFormReturn = {
  slots: SlotEntry[];
  expandedKey: string | null;
  setExpandedKey: React.Dispatch<React.SetStateAction<string | null>>;
  batchSubmitError: string | null;
  isSubmitting: boolean;
  updateSlot: (key: string, updates: Partial<SlotEntry>) => void;
  addSlot: () => void;
  removeSlot: (key: string) => void;
  handleSlotLiveUrlBlur: (
    key: string,
    url: string,
    slotTitle: string,
    slotGameId: string,
    slotStreamerIds: string[],
  ) => Promise<void>;
  handleBatchSubmit: (e: React.FormEvent) => Promise<void>;
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

export function useBatchScheduleForm({
  games,
  onClose,
}: UseBatchScheduleFormArgs): UseBatchScheduleFormReturn {
  const firstKeyRef = useRef(crypto.randomUUID());
  const [slots, setSlots] = useState<SlotEntry[]>(() => [
    { ...createSlot(), key: firstKeyRef.current },
  ]);
  const [expandedKey, setExpandedKey] = useState<string | null>(
    firstKeyRef.current,
  );
  const [batchSubmitError, setBatchSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      return prev.filter((s) => s.key !== key);
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

  return {
    slots,
    expandedKey,
    setExpandedKey,
    batchSubmitError,
    isSubmitting,
    updateSlot,
    addSlot,
    removeSlot,
    handleSlotLiveUrlBlur,
    handleBatchSubmit,
  };
}
