// src/components/MainTabController.tsx
'use client';

import { useState, useMemo, memo } from 'react';
import { Calendar as CalendarIcon, Users } from 'lucide-react';
import CalendarView from './Calendar/CalendarView';
import StreamerView from './streamer/StreamerView';

import type { Streamer, Game, Schedule } from '@prisma/client';

export type FlattenedSchedule = Omit<
  Schedule,
  'startTime' | 'endTime' | 'createdAt'
> & {
  startTime: Date;
  endTime: Date | null;
  createdAt: Date;
  participants: Streamer[];
  game?: Game | null;
};

interface MainTabControllerProps {
  initialSchedules: FlattenedSchedule[];
  streamers: Streamer[];
  games: Game[];
}

// 메모이제이션된 자식 컴포넌트들
const MemoCalendarView = memo(CalendarView);
const MemoStreamerView = memo(StreamerView);

export default function MainTabController({
  initialSchedules,
  streamers,
  games,
}: MainTabControllerProps) {
  const [activeTab, setActiveTab] = useState<'calendar' | 'streamers'>(
    'calendar',
  );

  // Props 메모이제이션
  const calendarProps = useMemo(
    () => ({
      initialSchedules,
      streamers,
      games,
    }),
    [initialSchedules, streamers, games],
  );

  const streamerProps = useMemo(
    () => ({
      streamers,
    }),
    [streamers],
  );

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* 🌟 상단 탭 네비게이션 🌟 */}
      <div className="px-6 pt-4 pb-2 shrink-0 flex justify-center">
        <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
              activeTab === 'calendar'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <CalendarIcon className="w-4 h-4" /> 스케줄
          </button>
          <button
            onClick={() => setActiveTab('streamers')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
              activeTab === 'streamers'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" /> 지도동 멤버
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative p-4 md:p-6">
        {/* 달력 탭 */}
        {activeTab === 'calendar' && (
          <div className="absolute inset-0 p-4 md:p-6 animate-in slide-in-from-left-8 fade-in duration-500">
            <MemoCalendarView
              initialSchedules={initialSchedules}
              streamers={streamers}
              games={games}
            />
          </div>
        )}

        {activeTab === 'streamers' && (
          <div className="absolute inset-0 p-4 md:p-6 animate-in slide-in-from-right-8 fade-in duration-500">
            <MemoStreamerView streamers={streamers} />
          </div>
        )}
      </div>
    </div>
  );
}
