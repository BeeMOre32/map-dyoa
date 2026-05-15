'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const KEY = 'favoriteStreamerIds';
const EVENT = 'favoriteStreamersChange';

function load(): string[] {
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

function save(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent<string[]>(EVENT, { detail: ids }));
}

export function useFavoriteStreamers() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(load());
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string[]>).detail;
      setIds(Array.isArray(detail) ? detail : load());
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      save(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback((id: string) => ids.includes(id), [ids]);

  const favoriteIds = useMemo(() => new Set(ids), [ids]);

  return { favoriteIds, favorites: ids, toggle, isFavorite };
}
