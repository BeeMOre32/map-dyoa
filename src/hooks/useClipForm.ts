'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { format, isValid } from 'date-fns';
import { useTheme } from 'next-themes';
import { createClipAction, updateClipAction } from '@/app/actions';
import { getStreamerColor } from '@/constants/streamercolor';
import { isChzzkClipUrl } from '@/lib/chzzk';
import { isYouTubeUrl } from '@/lib/youtube';
import { matchesChosung } from '@/lib/chosung';
import { clipClientSchema } from '@/lib/schemas';
import { scrollToFirstZodField } from '@/lib/zod-scroll';
import type { Streamer } from '@prisma/client';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';
import type { ClipWithParticipants } from '@/types/entities';

type MetaStatus = 'idle' | 'ok' | 'fail';

export function useClipForm(
  streamers: Streamer[],
  schedules: FlattenedSchedule[],
  onClose: () => void,
  initialData?: ClipWithParticipants,
) {
  const isEdit = initialData !== undefined;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [url, setUrl] = useState(initialData?.url ?? '');
  const [thumbnailUrl, setThumbnailUrl] = useState(initialData?.thumbnailUrl ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [clipDate, setClipDate] = useState(() => {
    if (!initialData?.clipDate) return '';
    const d = new Date(initialData.clipDate);
    return isValid(d) ? format(d, 'yyyy-MM-dd') : '';
  });
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialData?.participants.map((p) => p.streamerId) ?? [],
  );
  const [streamerSearch, setStreamerSearch] = useState('');
  const [scheduleId, setScheduleId] = useState(initialData?.scheduleId ?? '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [metaStatus, setMetaStatus] = useState<MetaStatus>(
    initialData?.thumbnailUrl ? 'ok' : 'idle',
  );

  const fetchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchMeta = useCallback(async (clipUrl: string) => {
    setFetchingMeta(true);
    setMetaStatus('idle');
    try {
      const apiUrl = isChzzkClipUrl(clipUrl)
        ? `/api/chzzk/clip-meta?url=${encodeURIComponent(clipUrl)}`
        : `/api/youtube/clip-meta?url=${encodeURIComponent(clipUrl)}`;
      const res = await fetch(apiUrl);
      const data = await res.json();
      if (res.ok) {
        if (data.thumbnailUrl) {
          setThumbnailUrl(data.thumbnailUrl);
          setMetaStatus('ok');
        } else {
          setMetaStatus('fail');
        }
        if (data.title) setTitle((prev) => prev || data.title);
      } else {
        setMetaStatus('fail');
      }
    } catch {
      setMetaStatus('fail');
    } finally {
      setFetchingMeta(false);
    }
  }, []);

  const handleUrlChange = useCallback(
    (value: string) => {
      setUrl(value);
      setMetaStatus('idle');
      if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
      if (isChzzkClipUrl(value) || isYouTubeUrl(value)) {
        fetchDebounceRef.current = setTimeout(() => fetchMeta(value), 600);
      }
    },
    [fetchMeta],
  );

  const filteredStreamers = useMemo(() => {
    const q = streamerSearch.trim();
    const base = q ? streamers.filter((s) => matchesChosung(s.name, q)) : streamers;
    return [...base].sort((a, b) => {
      const aSelected = selectedIds.includes(a.id) ? 0 : 1;
      const bSelected = selectedIds.includes(b.id) ? 0 : 1;
      return aSelected - bSelected;
    });
  }, [streamers, streamerSearch, selectedIds]);

  const filteredSchedules = useMemo(() => {
    if (selectedIds.length === 0) return schedules;
    const filtered = schedules.filter((s) =>
      s.participants.some((p) => selectedIds.includes(p.id)),
    );
    if (scheduleId && !filtered.some((s) => s.id === scheduleId)) {
      const current = schedules.find((s) => s.id === scheduleId);
      if (current) return [current, ...filtered];
    }
    return filtered;
  }, [selectedIds, schedules, scheduleId]);

  const toggleStreamer = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setScheduleId('');
  };

  const getStreamerChipColor = (streamerId: string, colorCode: string) =>
    getStreamerColor(streamerId, isDark) ?? colorCode;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsed = clipClientSchema.safeParse({ title, url, streamerIds: selectedIds });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      const formRoot =
        typeof document !== 'undefined'
          ? document.getElementById('clip-form')
          : null;
      scrollToFirstZodField(parsed.error.issues, {
        root: formRoot ?? undefined,
      });
      return;
    }

    const payload = {
      title: title.trim(),
      url: url.trim(),
      streamerIds: selectedIds,
      scheduleId: scheduleId || undefined,
      thumbnailUrl: thumbnailUrl.trim() || undefined,
      description: description.trim() || undefined,
      clipDate: clipDate ? new Date(clipDate) : undefined,
    };

    setSubmitting(true);
    const result = isEdit
      ? await updateClipAction(initialData.id, payload)
      : await createClipAction(payload);
    setSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.error ?? '오류가 발생했습니다.');
    }
  };

  return {
    isEdit,
    title, setTitle,
    url,
    thumbnailUrl, setThumbnailUrl,
    description, setDescription,
    clipDate, setClipDate,
    selectedIds,
    streamerSearch, setStreamerSearch,
    scheduleId, setScheduleId,
    error,
    submitting,
    fetchingMeta,
    metaStatus,
    filteredStreamers,
    filteredSchedules,
    handleUrlChange,
    toggleStreamer,
    getStreamerChipColor,
    handleSubmit,
  };
}
