'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

const KEY = 'favoriteStreamerIds';
const FILTER_ONLY_KEY = 'favoriteFilterOnly';

const EMPTY_IDS: string[] = [];

type Listener = () => void;
const listeners = new Set<Listener>();

/** useSyncExternalStore는 Object.is로 스냅샷 비교 → 동일 내용이면 같은 배열 참조 유지 */
let cachedIds: string[] = EMPTY_IDS;
let cachedIdsKey = '[]';
let cachedFavoritesOnly = false;

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  listeners.forEach((l) => l());
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY || e.key === FILTER_ONLY_KEY) emit();
  });
}

function loadIds(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

function loadFavoritesOnly(): boolean {
  try {
    return localStorage.getItem(FILTER_ONLY_KEY) === 'true';
  } catch {
    return false;
  }
}

function syncIdsCache(next: string[]) {
  const key = JSON.stringify(next);
  if (key === cachedIdsKey) return false;
  cachedIdsKey = key;
  cachedIds = next.length === 0 ? EMPTY_IDS : next;
  return true;
}

function getIdsSnapshot(): string[] {
  syncIdsCache(loadIds());
  return cachedIds;
}

function getFavoritesOnlySnapshot(): boolean {
  const next = loadFavoritesOnly();
  if (next === cachedFavoritesOnly) return cachedFavoritesOnly;
  cachedFavoritesOnly = next;
  return cachedFavoritesOnly;
}

function persistIds(next: string[]) {
  if (!syncIdsCache(next)) return;
  localStorage.setItem(KEY, cachedIdsKey);
  emit();
}

function persistFavoritesOnly(value: boolean) {
  if (cachedFavoritesOnly === value && loadFavoritesOnly() === value) return;
  cachedFavoritesOnly = value;
  localStorage.setItem(FILTER_ONLY_KEY, String(value));
  emit();
}

export function useFavoriteStreamers() {
  const ids = useSyncExternalStore(subscribe, getIdsSnapshot, () => EMPTY_IDS);
  const favoritesOnly = useSyncExternalStore(
    subscribe,
    getFavoritesOnlySnapshot,
    () => false,
  );

  const toggle = useCallback((id: string) => {
    const prev = loadIds();
    const next = prev.includes(id)
      ? prev.filter((x) => x !== id)
      : [...prev, id];
    persistIds(next);
  }, []);

  const isFavorite = useCallback((id: string) => ids.includes(id), [ids]);

  const favoriteIds = useMemo(() => new Set(ids), [ids]);

  const setFavoritesOnly = useCallback((value: boolean) => {
    persistFavoritesOnly(value);
  }, []);

  return {
    favoriteIds,
    favorites: ids,
    toggle,
    isFavorite,
    favoritesOnly,
    setFavoritesOnly,
  };
}
