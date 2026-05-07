'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Streamer } from '@prisma/client';
import { getLiveUrl } from '@/components/multiview/utils';

export function useMultiViewState(participants: Streamer[]) {
  const [phase, setPhase] = useState<'select' | 'watch'>('select');
  const [order, setOrder] = useState<string[]>(participants.map((p) => p.id));
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [chatStreamerId, setChatStreamerId] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setToast(true), 800);
    const hide = setTimeout(() => setToast(false), 6800);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, []);

  const orderedVisible = useMemo(
    () => order
      .filter((id) => visible.has(id))
      .map((id) => participants.find((p) => p.id === id))
      .filter((p): p is Streamer => !!p),
    [order, visible, participants],
  );

  const hiddenInWatch = phase === 'watch' ? participants.filter((p) => !visible.has(p.id)) : [];
  const allLoaded = orderedVisible.length > 0 && orderedVisible.every((s) => loaded.has(s.id));
  const focusedStreamer = focusedId ? orderedVisible.find((p) => p.id === focusedId) ?? null : null;
  const otherStreamers = focusedStreamer ? orderedVisible.filter((p) => p.id !== focusedId) : [];

  const handleStart = (selectedIds: string[]) => {
    setVisible(new Set(selectedIds));
    setLoaded(new Set(selectedIds));
    setPhase('watch');
  };

  const hidePanel = (id: string) => {
    setVisible((prev) => { const n = new Set(prev); n.delete(id); return n; });
    setLoaded((prev) => { const n = new Set(prev); n.delete(id); return n; });
    if (focusedId === id) setFocusedId(null);
    if (chatStreamerId === id) setChatStreamerId(null);
  };

  const restore = (id: string) => setVisible((prev) => new Set([...prev, id]));

  const load = (id: string) => setLoaded((prev) => new Set([...prev, id]));

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

  return {
    phase,
    orderedVisible,
    hiddenInWatch,
    allLoaded,
    focusedStreamer,
    otherStreamers,
    loaded,
    toast, setToast,
    chatStreamerId, setChatStreamerId,
    focusedId, setFocusedId,
    handleStart,
    hidePanel,
    restore,
    load,
    loadAll,
    unloadAll,
    swapVisible,
    openAll,
    exitToSelect,
  };
}
