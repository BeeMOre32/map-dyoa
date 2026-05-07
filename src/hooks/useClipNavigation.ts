'use client';

import { useState, useCallback, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ClipSortOption } from '@/lib/data-fetching';

export type { ClipSortOption };

interface ClipFilters {
  streamerId: string;
  month: string;
  q: string;
  sort: ClipSortOption;
}

export function useClipNavigation(currentFilters: ClipFilters, currentPage: number) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(currentFilters.q);

  useEffect(() => {
    setSearchValue(currentFilters.q);
  }, [currentFilters.q]);

  const buildUrl = useCallback(
    (updates: Partial<{ page: number; streamer: string; month: string; q: string; sort: ClipSortOption }>) => {
      const merged = {
        streamer: currentFilters.streamerId,
        month: currentFilters.month,
        q: currentFilters.q,
        sort: currentFilters.sort,
        page: currentPage,
        ...updates,
      };
      const params = new URLSearchParams();
      if (merged.streamer) params.set('streamer', merged.streamer);
      if (merged.month) params.set('month', merged.month);
      if (merged.q) params.set('q', merged.q);
      if (merged.sort && merged.sort !== 'newest') params.set('sort', merged.sort);
      if (merged.page && merged.page > 1) params.set('page', String(merged.page));
      const qs = params.toString();
      return qs ? `/clips?${qs}` : '/clips';
    },
    [currentFilters, currentPage],
  );

  const navigate = useCallback(
    (url: string) => startTransition(() => router.push(url)),
    [router],
  );

  useEffect(() => {
    if (searchValue === currentFilters.q) return;
    const timer = setTimeout(() => navigate(buildUrl({ q: searchValue, page: 1 })), 400);
    return () => clearTimeout(timer);
  }, [searchValue, currentFilters.q, navigate, buildUrl]);

  const clearFilters = () => navigate('/clips');

  return {
    isPending,
    searchValue, setSearchValue,
    buildUrl,
    navigate,
    clearFilters,
    hasFilter: !!(currentFilters.streamerId || currentFilters.month || currentFilters.q),
  };
}

export function buildPageItems(totalPages: number, currentPage: number): (number | 'ellipsis')[] {
  return Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
    .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('ellipsis');
      acc.push(p);
      return acc;
    }, []);
}
