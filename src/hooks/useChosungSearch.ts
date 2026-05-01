'use client';

import { useState, useMemo } from 'react';
import { matchesChosung } from '@/lib/chosung';

export function useChosungSearch<T extends { name: string }>(
  items: T[],
  additionalFilter?: (item: T) => boolean,
) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch = !search || matchesChosung(item.name, search);
      const matchExtra = additionalFilter ? additionalFilter(item) : true;
      return matchSearch && matchExtra;
    });
  }, [items, search, additionalFilter]);

  return { search, setSearch, filtered };
}
