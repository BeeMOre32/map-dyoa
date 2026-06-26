'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Streamer } from '@prisma/client';
import { getLiveUrl, type LayoutPreset } from '@/components/multiview/utils';
import {
  loadMultiviewState,
  multiviewStorageKey,
  saveMultiviewState,
  type MultiviewPersistedState,
} from '@/components/multiview/persistence';

function mergeOrder(saved: string[] | undefined, defaultIds: string[]): string[] {
  if (!saved?.length) return defaultIds;
  const valid = saved.filter((id) => defaultIds.includes(id));
  const missing = defaultIds.filter((id) => !valid.includes(id));
  return [...valid, ...missing];
}

function idsInSet(ids: string[] | undefined, defaultIds: string[]): Set<string> {
  if (!ids?.length) return new Set();
  return new Set(ids.filter((id) => defaultIds.includes(id)));
}

function applyPersistedState(
  saved: MultiviewPersistedState,
  defaultIds: string[],
  autoStart: boolean,
) {
  const order = mergeOrder(saved.order, defaultIds);
  const visible = autoStart
    ? idsInSet(saved.visible?.length ? saved.visible : defaultIds, defaultIds)
    : idsInSet(saved.visible, defaultIds);
  const loaded = idsInSet(saved.loaded, defaultIds);
  const focusedId =
    saved.focusedId && defaultIds.includes(saved.focusedId) ? saved.focusedId : null;
  const chatStreamerId =
    saved.chatStreamerId && defaultIds.includes(saved.chatStreamerId)
      ? saved.chatStreamerId
      : null;
  const mutedIds = saved.mutedIds?.length
    ? idsInSet(saved.mutedIds, defaultIds)
    : new Set(defaultIds);

  return {
    order,
    visible,
    loaded,
    focusedId,
    chatStreamerId,
    pinControls: saved.pinControls ?? false,
    mutedIds,
    layoutPreset: saved.layoutPreset ?? ('auto' as LayoutPreset),
    gridLayout: { rowH: saved.gridRowH, colB: saved.gridColB },
    focusLayout: { split: saved.focusSplit, sideH: saved.focusSideH },
  };
}

export function useMultiViewState(
  participants: Streamer[],
  options?: { autoStart?: boolean },
) {
  const defaultIds = participants.map((p) => p.id);
  const autoStart = options?.autoStart ?? false;
  const storageKey = useMemo(() => multiviewStorageKey(defaultIds), [defaultIds]);

  const [hasRestored, setHasRestored] = useState(false);
  const [phase, setPhase] = useState<'select' | 'watch'>(() => (autoStart ? 'watch' : 'select'));
  const [order, setOrder] = useState<string[]>(() => defaultIds);
  const [visible, setVisible] = useState<Set<string>>(() =>
    autoStart ? new Set(defaultIds) : new Set(),
  );
  const [loaded, setLoaded] = useState<Set<string>>(() => new Set());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [chatStreamerId, setChatStreamerId] = useState<string | null>(null);
  const [pinControls, setPinControls] = useState(false);
  const [mutedIds, setMutedIds] = useState<Set<string>>(() => new Set(defaultIds));
  const [layoutPreset, setLayoutPreset] = useState<LayoutPreset>('auto');
  const [gridLayout, setGridLayout] = useState<{
    rowH?: number[];
    colB?: number[][];
  }>({});
  const [focusLayout, setFocusLayout] = useState<{
    split?: number;
    sideH?: number[];
  }>({});

  useEffect(() => {
    if (!autoStart) {
      setHasRestored(true);
      return;
    }
    const saved = loadMultiviewState(storageKey);
    if (saved) {
      const next = applyPersistedState(saved, defaultIds, autoStart);
      setOrder(next.order);
      setVisible(next.visible);
      setLoaded(next.loaded);
      setFocusedId(next.focusedId);
      setChatStreamerId(next.chatStreamerId);
      setPinControls(next.pinControls);
      setMutedIds(next.mutedIds);
      setLayoutPreset(next.layoutPreset);
      setGridLayout(next.gridLayout);
      setFocusLayout(next.focusLayout);
    }
    setHasRestored(true);
  }, [autoStart, storageKey, defaultIds]);

  useEffect(() => {
    if (!hasRestored || phase !== 'watch') return;
    saveMultiviewState(storageKey, {
      order,
      visible: [...visible],
      loaded: [...loaded],
      focusedId,
      chatStreamerId,
      pinControls,
      mutedIds: [...mutedIds],
      layoutPreset,
      gridRowH: gridLayout.rowH,
      gridColB: gridLayout.colB,
      focusSplit: focusLayout.split,
      focusSideH: focusLayout.sideH,
    });
  }, [
    hasRestored,
    phase,
    storageKey,
    order,
    visible,
    loaded,
    focusedId,
    chatStreamerId,
    pinControls,
    mutedIds,
    layoutPreset,
    gridLayout,
    focusLayout,
  ]);

  const orderedVisible = useMemo(
    () =>
      order
        .filter((id) => visible.has(id))
        .map((id) => participants.find((p) => p.id === id))
        .filter((p): p is Streamer => !!p),
    [order, visible, participants],
  );

  const hiddenInWatch = phase === 'watch' ? participants.filter((p) => !visible.has(p.id)) : [];
  const allLoaded = orderedVisible.length > 0 && orderedVisible.every((s) => loaded.has(s.id));
  const focusedStreamer = focusedId ? (orderedVisible.find((p) => p.id === focusedId) ?? null) : null;
  const otherStreamers = focusedStreamer ? orderedVisible.filter((p) => p.id !== focusedId) : [];

  const handleStart = (selectedIds: string[]) => {
    setVisible(new Set(selectedIds));
    setLoaded(new Set(selectedIds));
    setMutedIds(new Set(selectedIds));
    setPhase('watch');
  };

  const hidePanel = (id: string) => {
    setVisible((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
    setLoaded((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
    if (focusedId === id) setFocusedId(null);
    if (chatStreamerId === id) setChatStreamerId(null);
  };

  const restore = (id: string) => {
    setVisible((prev) => new Set([...prev, id]));
  };

  const load = (id: string) => {
    setLoaded((prev) => new Set([...prev, id]));
    setMutedIds((prev) => new Set([...prev, id]));
  };

  const loadAll = () => setLoaded(new Set([...visible]));

  const unloadAll = () => setLoaded(new Set());

  const swapVisible = (id: string, dir: -1 | 1) => {
    const visIdx = orderedVisible.findIndex((p) => p.id === id);
    const targetIdx = visIdx + dir;
    if (targetIdx < 0 || targetIdx >= orderedVisible.length) return;
    const targetId = orderedVisible[targetIdx].id;
    setOrder((prev) => {
      const next = [...prev];
      const a = next.indexOf(id);
      const b = next.indexOf(targetId);
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
  };

  const reorder = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;
    setOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(fromId);
      const to = next.indexOf(toId);
      if (from < 0 || to < 0) return prev;
      next.splice(from, 1);
      next.splice(to, 0, fromId);
      return next;
    });
  }, []);

  const toggleMute = useCallback((id: string) => {
    setMutedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const muteAllExcept = useCallback(
    (id: string) => {
      setMutedIds(new Set(orderedVisible.filter((s) => s.id !== id).map((s) => s.id)));
    },
    [orderedVisible],
  );

  const openAll = () => {
    participants
      .filter((s) => visible.has(s.id))
      .forEach((s) => window.open(getLiveUrl(s), '_blank', 'noopener,noreferrer'));
  };

  const exitToSelect = () => {
    setPhase('select');
    setLoaded(new Set());
    setFocusedId(null);
    setChatStreamerId(null);
  };

  const focusByIndex = useCallback(
    (index: number) => {
      const s = orderedVisible[index];
      if (!s) return;
      setFocusedId((prev) => (prev === s.id ? null : s.id));
    },
    [orderedVisible],
  );

  return {
    phase,
    orderedVisible,
    hiddenInWatch,
    allLoaded,
    focusedStreamer,
    otherStreamers,
    loaded,
    mutedIds,
    pinControls,
    setPinControls,
    layoutPreset,
    setLayoutPreset,
    gridLayout,
    setGridLayout,
    focusLayout,
    setFocusLayout,
    chatStreamerId,
    setChatStreamerId,
    focusedId,
    setFocusedId,
    handleStart,
    hidePanel,
    restore,
    load,
    loadAll,
    unloadAll,
    swapVisible,
    reorder,
    toggleMute,
    muteAllExcept,
    openAll,
    exitToSelect,
    focusByIndex,
  };
}
