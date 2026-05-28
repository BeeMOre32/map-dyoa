import { useState, useCallback, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { FlattenedSchedule, ParticipantFlat } from '@/lib/schedule-formatters';
import { createScheduleAction, updateScheduleAction } from '@/app/actions';
import { matchChzzkCategory } from '@/constants/chzzkGameMap';
import type { Streamer } from '@prisma/client';
import {
  editSchema,
  EditErrors,
  ParticipantEntry,
  AutoFillResult,
} from '../types';
import { scrollToFirstZodField } from '@/lib/zod-scroll';
import { buildScheduleActionPayload } from '@/lib/schedule-payload';
import {
  createEmptyParticipant,
  isHoi4GameById,
  resolveNaeJeonForPayload,
} from '@/lib/hoi4/hoi4FormUtils';
import { pickScheduleRevision } from '@/lib/schedule-concurrency';
import { useToast } from '@/components/Common/Toaster';

type UseEditScheduleFormArgs = {
  initialData?: FlattenedSchedule | null;
  isEdit: boolean;
  games: { id: string; title: string; isHoi4: boolean }[];
  streamers: Streamer[];
  onOptimisticCreate?: (schedule: FlattenedSchedule) => void;
  onScheduleUpdated?: (schedule: FlattenedSchedule) => void;
  onClose: () => void;
};

function createParticipant(streamer: Pick<Streamer, 'id' | 'isGuest'>): ParticipantEntry {
  return { id: streamer.id, nation: '', isGuest: streamer.isGuest };
}

type UseEditScheduleFormReturn = {
  title: string;
  setTitle: (v: string) => void;
  startTime: string;
  setStartTime: (v: string) => void;
  selectedGameId: string;
  setSelectedGameId: (v: string) => void;
  participants: ParticipantEntry[];
  setParticipants: React.Dispatch<React.SetStateAction<ParticipantEntry[]>>;
  liveUrls: string[];
  setLiveUrls: React.Dispatch<React.SetStateAction<string[]>>;
  isTimeTBD: boolean;
  setIsTimeTBD: (v: boolean) => void;
  isNaeJeon: boolean;
  setIsNaeJeon: (v: boolean) => void;
  isLiveEnded: boolean;
  setIsLiveEnded: (v: boolean) => void;
  editErrors: EditErrors;
  isSubmitting: boolean;
  editMetaLoading: boolean;
  editAutoFilled: string[];
  setEditAutoFilled: React.Dispatch<React.SetStateAction<string[]>>;
  selectedStreamers: string[];
  guestStreamers: string[];
  isHoi4Game: boolean;
  toggleStreamer: (id: string) => void;
  toggleGuest: (id: string) => void;
  clearEditError: (field: keyof EditErrors) => void;
  updateParticipant: (id: string, field: 'nation', value: string) => void;
  handleLiveUrlBlur: (urlIndex: number) => Promise<void>;
  handleEditSubmit: (e: React.FormEvent) => Promise<void>;
};

export function useEditScheduleForm({
  initialData,
  isEdit,
  games,
  streamers,
  onOptimisticCreate,
  onScheduleUpdated,
  onClose,
}: UseEditScheduleFormArgs): UseEditScheduleFormReturn {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();

  const defaultTime = initialData?.startTime
    ? format(new Date(initialData.startTime), "yyyy-MM-dd'T'HH:mm")
    : '';

  const [title, setTitle] = useState(initialData?.title || '');
  const [startTime, setStartTime] = useState(defaultTime);
  const [selectedGameId, setSelectedGameId] = useState(initialData?.gameId || '');
  const [participants, setParticipants] = useState<ParticipantEntry[]>(
    initialData?.participants?.map((p) => ({
      id: p.id,
      nation: p.nation ?? '',
      isGuest: p.isGuest ?? false,
    })) || [],
  );
  const [liveUrls, setLiveUrls] = useState<string[]>(
    initialData?.liveUrls?.length ? initialData.liveUrls : [''],
  );
  const [isTimeTBD, setIsTimeTBD] = useState(initialData?.isGuerrilla || false);
  const [isNaeJeon, setIsNaeJeon] = useState(initialData?.isNaeJeon || false);
  const [isLiveEnded, setIsLiveEnded] = useState(initialData?.isLiveEnded || false);
  const [editErrors, setEditErrors] = useState<EditErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editMetaLoading, setEditMetaLoading] = useState(false);
  const [editAutoFilled, setEditAutoFilled] = useState<string[]>([]);

  const selectedStreamers = participants.map((p) => p.id);
  const guestStreamers = participants.filter((p) => p.isGuest).map((p) => p.id);
  const isHoi4Game =
    isHoi4GameById(selectedGameId, games) ||
    (initialData?.gameId === selectedGameId && initialData?.game?.isHoi4) ||
    false;
  const streamerMap = useMemo(() => new Map(streamers.map((s) => [s.id, s])), [streamers]);

  const toggleStreamer = (id: string) => {
    setParticipants((prev) =>
      prev.some((p) => p.id === id)
        ? prev.filter((p) => p.id !== id)
        : streamerMap.has(id)
          ? [...prev, createParticipant(streamerMap.get(id)!)]
          : prev,
    );
    if (editErrors.streamerIds)
      setEditErrors((e) => ({ ...e, streamerIds: undefined }));
  };

  const toggleGuest = (id: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isGuest: !p.isGuest } : p)),
    );
  };

  const clearEditError = (field: keyof EditErrors) => {
    setEditErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const updateParticipant = (id: string, field: 'nation', value: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
    if (field === 'nation' && value.trim() && isHoi4Game) {
      setIsNaeJeon(true);
    }
  };

  const handleLiveUrlBlur = useCallback(
    async (urlIndex: number) => {
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
            createParticipant(streamerMap.get(data.matchedStreamerId!) ?? {
              id: data.matchedStreamerId!,
              isGuest: false,
            }),
          ]);
          filled.push(`멤버 (${data.matchedStreamerName})`);
        }
        setEditAutoFilled(filled);
      } catch {
        /* silent */
      } finally {
        setEditMetaLoading(false);
      }
    },
    [liveUrls, title, selectedGameId, selectedStreamers, games, streamerMap],
  );

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = editSchema.safeParse({
      title,
      startTime,
      streamerIds: selectedStreamers,
    });
    if (!parsed.success) {
      const fieldErrors: EditErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof EditErrors;
        fieldErrors[field] = issue.message;
      }
      setEditErrors(fieldErrors);
      const formEl =
        typeof document !== 'undefined'
          ? document.getElementById('schedule-form')
          : null;
      scrollToFirstZodField(parsed.error.issues, {
        root: formEl ?? undefined,
      });
      return;
    }
    setEditErrors({});
    setIsSubmitting(true);
    const resolvedStartTime = isTimeTBD
      ? new Date(startTime.split('T')[0] + 'T00:00')
      : new Date(startTime);
    const cleanUrls = liveUrls.map((u) => u.trim()).filter(Boolean);
    const resolvedNaeJeon = resolveNaeJeonForPayload(isHoi4Game, isNaeJeon, participants);
    const expectedUpdatedAt =
      isEdit && initialData ? pickScheduleRevision(initialData) ?? undefined : undefined;
    const payload = buildScheduleActionPayload({
      title,
      startTime: resolvedStartTime,
      participants: participants.map(({ id, nation, isGuest }) => ({
        id,
        nation,
        isGuest,
      })),
      gameId: selectedGameId || null,
      games,
      liveUrls: cleanUrls,
      isGuerrilla: isTimeTBD,
      isNaeJeon: resolvedNaeJeon,
      isLiveEnded: isEdit ? isLiveEnded : false,
      ...(expectedUpdatedAt ? { expectedUpdatedAt } : {}),
    });
    const result = isEdit
      ? await updateScheduleAction(initialData!.id, payload)
      : await createScheduleAction(payload);
    if (result.success) {
      if (isEdit && initialData) {
        const selectedGame = games.find((g) => g.id === selectedGameId) ?? null;
        const updated: FlattenedSchedule = {
          ...initialData,
          title,
          gameId: selectedGameId || null,
          game: selectedGame,
          isGuerrilla: isTimeTBD,
          isNaeJeon: resolvedNaeJeon,
          isLiveEnded,
          liveUrls: cleanUrls,
          startTime: resolvedStartTime,
          updatedAt: new Date(),
          participants: streamers
            .filter((s) => selectedStreamers.includes(s.id))
            .map((s) => {
              const p = participants.find((x) => x.id === s.id);
              return {
                ...s,
                nation: p?.nation.trim() || null,
                result: null,
                isGuest: p?.isGuest ?? false,
              };
            })
            .sort(
              (a, b) =>
                Number(a.isGuest) - Number(b.isGuest) ||
                a.name.localeCompare(b.name, 'ko'),
            ),
          formattedDate: format(resolvedStartTime, 'yyyy년 MM월 dd일(EEEE)', {
            locale: ko,
          }),
          formattedTime: isTimeTBD
            ? '시간 미정'
            : format(resolvedStartTime, 'HH:mm'),
        };
        onScheduleUpdated?.(updated);
        toast.success('일정이 수정되었습니다.');
      }
      if (!isEdit && onOptimisticCreate) {
        const selectedGame = games.find((g) => g.id === selectedGameId) ?? null;
        const flatParticipants: ParticipantFlat[] = streamers
          .filter((s) => selectedStreamers.includes(s.id))
          .map((s) => {
            const p = participants.find((x) => x.id === s.id);
            return {
              ...s,
              nation: p?.nation.trim() || null,
              result: null,
              isGuest: p?.isGuest ?? false,
            };
          });
        const startDate = new Date(startTime);
        onOptimisticCreate({
          id: result.data?.id ?? `optimistic-${Date.now()}`,
          title,
          content: null,
          gameId: selectedGameId || null,
          isGuerrilla: isTimeTBD,
          isNaeJeon: resolvedNaeJeon,
          isLiveEnded: false,
          liveUrls: cleanUrls,
          startTime: startDate,
          endTime: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          participants: flatParticipants,
          game: selectedGame,
          formattedDate: format(startDate, 'yyyy년 MM월 dd일(EEEE)', {
            locale: ko,
          }),
          formattedTime: format(startDate, 'HH:mm'),
        });
      }
      startTransition(() => {
        router.refresh();
      });
      onClose();
    } else {
      const msg = result.error ?? '일정 저장에 실패했습니다. 다시 시도해주세요.';
      setEditErrors({ submit: msg });
      toast.error(msg);
      if (result.errorCode === 'CONFLICT') {
        startTransition(() => {
          router.refresh();
        });
      }
    }
    setIsSubmitting(false);
  };

  return {
    title,
    setTitle,
    startTime,
    setStartTime,
    selectedGameId,
    setSelectedGameId,
    participants,
    setParticipants,
    liveUrls,
    setLiveUrls,
    isTimeTBD,
    setIsTimeTBD,
    isNaeJeon,
    setIsNaeJeon,
    isLiveEnded,
    setIsLiveEnded,
    editErrors,
    isSubmitting,
    editMetaLoading,
    editAutoFilled,
    setEditAutoFilled,
    selectedStreamers,
    guestStreamers,
    isHoi4Game,
    toggleStreamer,
    toggleGuest,
    clearEditError,
    updateParticipant,
    handleLiveUrlBlur,
    handleEditSubmit,
  };
}
