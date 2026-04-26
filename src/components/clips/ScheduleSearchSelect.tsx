'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, ChevronDown, Tv, CalendarDays } from 'lucide-react';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';

interface ScheduleSearchSelectProps {
  schedules: FlattenedSchedule[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ScheduleSearchSelect({
  schedules,
  value,
  onChange,
  disabled,
  placeholder = '방송 검색...',
}: ScheduleSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = schedules.find((s) => s.id === value) ?? null;

  // 날짜 필터용 — "YYYY-MM" 목록 (중복 제거)
  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    schedules.forEach((s) => {
      const d = new Date(s.startTime);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [schedules]);

  const filtered = useMemo(() => {
    let list = schedules;
    if (dateFilter) {
      list = list.filter((s) => {
        const d = new Date(s.startTime);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return ym === dateFilter;
      });
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((s) => s.title.toLowerCase().includes(q));
    }
    return list;
  }, [schedules, query, dateFilter]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleOpen() {
    if (disabled) return;
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleSelect(id: string) {
    onChange(id);
    setOpen(false);
    setQuery('');
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('');
    setQuery('');
  }

  const baseInput =
    'w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 transition-all';

  return (
    <div ref={containerRef} className="relative">
      {/* 트리거 버튼 */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`${baseInput} flex items-center justify-between gap-2 cursor-pointer text-left ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${!selected ? 'text-slate-400' : ''}`}
      >
        <span className="flex items-center gap-2 truncate">
          {selected ? (
            <>
              <Tv className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="truncate">
                <span className="text-slate-400 mr-1">{selected.formattedDate}</span>
                {selected.title}
              </span>
            </>
          ) : (
            <span>{disabled ? '스트리머를 먼저 선택하세요' : placeholder}</span>
          )}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {selected && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e as any)}
              className="p-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-slate-400" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {/* 드롭다운 */}
      {open && (
        <div className="absolute z-50 top-full mt-2 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden">
          {/* 검색 + 날짜 필터 헤더 */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
            {/* 검색 입력 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="방송 제목 검색..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 transition-all"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 월 필터 */}
            {monthOptions.length > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <button
                  type="button"
                  onClick={() => setDateFilter('')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all ${
                    !dateFilter
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  전체
                </button>
                {monthOptions.map((ym) => {
                  const [y, m] = ym.split('-');
                  return (
                    <button
                      key={ym}
                      type="button"
                      onClick={() => setDateFilter(ym === dateFilter ? '' : ym)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all ${
                        dateFilter === ym
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {y}년 {parseInt(m)}월
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 결과 목록 */}
          <ul className="max-h-48 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-slate-400 font-bold">
                {query ? `"${query}" 검색 결과가 없습니다` : '방송이 없습니다'}
              </li>
            ) : (
              filtered.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(s.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors ${
                      value === s.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {value === s.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                      )}
                      <div className={value === s.id ? '' : 'pl-3.5'}>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 line-clamp-1">
                          {s.title}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {s.formattedDate} {s.formattedTime}
                          {s.game && (
                            <span className="ml-1.5 text-indigo-400">
                              · {s.game.title}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>

          {/* 결과 카운트 */}
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-bold">
            {filtered.length}개 방송
          </div>
        </div>
      )}
    </div>
  );
}
