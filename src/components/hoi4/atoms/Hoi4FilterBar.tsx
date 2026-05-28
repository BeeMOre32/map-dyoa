'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { Hoi4LeaderboardData } from '@/lib/data-fetching';
import type { Hoi4FilterState } from '@/lib/hoi4/hoi4FormUtils';
import { HOI4_PERIOD_OPTIONS } from '@/lib/hoi4/hoi4FormUtils';

type Hoi4FilterBarProps = {
  filters: Hoi4FilterState;
  members: Hoi4LeaderboardData['leaderboard'];
  onChange: (next: Partial<Hoi4FilterState>) => void;
  onClear: () => void;
  hasActiveFilter: boolean;
};

export default function Hoi4FilterBar({
  filters,
  members,
  onChange,
  onClear,
  hasActiveFilter,
}: Hoi4FilterBarProps) {
  return (
    <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex items-center gap-2 px-1">
        <SlidersHorizontal className="h-3.5 w-3.5 text-amber-500" />
        <span className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
          필터
        </span>
        {hasActiveFilter ? (
          <button
            type="button"
            onClick={onClear}
            className="ml-auto inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          >
            <X className="h-3 w-3" />
            초기화
          </button>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <select
          value={filters.memberId ?? ''}
          onChange={(e) => onChange({ memberId: e.target.value || null })}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="">전체 멤버</option>
          {members.map((entry) => (
            <option key={entry.streamer.id} value={entry.streamer.id}>
              {entry.streamer.name}
            </option>
          ))}
        </select>

        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={filters.nationQuery}
            onChange={(e) => onChange({ nationQuery: e.target.value })}
            placeholder="국가 검색"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
        </label>

        <select
          value={filters.periodMonths?.toString() ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            onChange({ periodMonths: v ? Number(v) : null });
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          {HOI4_PERIOD_OPTIONS.map((opt) => (
            <option key={opt.label} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
