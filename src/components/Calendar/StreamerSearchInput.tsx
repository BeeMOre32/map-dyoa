'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import type { Streamer } from '@prisma/client';
import { matchesChosung } from '@/lib/chosung';

interface StreamerSearchInputProps {
  streamers: Streamer[];
  onFilter: (filtered: Streamer[]) => void;
}

export default function StreamerSearchInput({ streamers, onFilter }: StreamerSearchInputProps) {
  const [query, setQuery] = useState('');

  function handleChange(value: string) {
    setQuery(value);
    const trimmed = value.trim();
    onFilter(
      trimmed ? streamers.filter((s) => matchesChosung(s.name, trimmed)) : streamers
    );
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 dark:text-slate-600 pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="스트리머 검색..."
        className="w-full pl-8 pr-3 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-300 dark:focus:border-indigo-700 transition-colors"
      />
    </div>
  );
}
