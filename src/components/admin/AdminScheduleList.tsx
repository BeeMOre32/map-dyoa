'use client';

import { useState, useTransition } from 'react';
import { Trash2, Calendar, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { deleteScheduleAction } from '@/app/actions';
import { useRouter } from 'next/navigation';

type ScheduleItem = {
  id: string;
  title: string;
  startTime: Date;
  isGuerrilla: boolean;
  game: { id: string; title: string } | null;
  participants: { streamer: { id: string; name: string; colorCode: string } }[];
};

function DeleteScheduleButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (confirm) {
    return (
      <div className="flex gap-1">
        <button
          onClick={() => startTransition(async () => {
            await deleteScheduleAction(id);
            router.refresh();
          })}
          disabled={isPending}
          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
        </button>
        <button onClick={() => setConfirm(false)} className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-xl">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors bg-slate-100 dark:bg-slate-700 rounded-xl"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

export default function AdminScheduleList({
  schedules,
  defaultFrom,
  defaultTo,
}: {
  schedules: ScheduleItem[];
  defaultFrom?: string;
  defaultTo?: string;
}) {
  const router = useRouter();
  const [from, setFrom] = useState(defaultFrom ?? '');
  const [to, setTo] = useState(defaultTo ?? '');

  const applyFilter = () => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    router.push(`/admin/schedules?${params.toString()}`);
  };

  const resetFilter = () => {
    setFrom('');
    setTo('');
    router.push('/admin/schedules');
  };

  return (
    <div className="p-8 space-y-6 bg-white dark:bg-slate-950 transition-colors">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">일정 관리</h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold mt-2">
          {schedules.length}개 표시 중
        </p>
      </div>

      {/* 날짜 필터 */}
      <div className="flex flex-wrap items-end gap-3 p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="space-y-1">
          <label className="text-xs font-black text-slate-500 uppercase tracking-wider">시작일</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-black text-slate-500 uppercase tracking-wider">종료일</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <button
          onClick={applyFilter}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors"
        >
          필터 적용
        </button>
        {(from || to) && (
          <button
            onClick={resetFilter}
            className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-xl transition-colors"
          >
            초기화
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        {schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 dark:text-slate-500">
            <Calendar className="w-10 h-10 opacity-40" />
            <p className="font-bold text-sm">일정이 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate text-sm">{schedule.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                      {schedule.isGuerrilla
                        ? format(new Date(schedule.startTime), 'yyyy.MM.dd', { locale: ko }) + ' (게릴라)'
                        : format(new Date(schedule.startTime), 'yyyy.MM.dd a h:mm', { locale: ko })}
                    </span>
                    {schedule.game && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                        {schedule.game.title}
                      </span>
                    )}
                    {schedule.participants.slice(0, 3).map((p) => (
                      <span
                        key={p.streamer.id}
                        className="text-[11px] font-bold px-2 py-0.5 rounded-lg"
                        style={{ backgroundColor: `${p.streamer.colorCode}20`, color: p.streamer.colorCode }}
                      >
                        {p.streamer.name}
                      </span>
                    ))}
                    {schedule.participants.length > 3 && (
                      <span className="text-[11px] text-slate-400 font-bold">+{schedule.participants.length - 3}</span>
                    )}
                  </div>
                </div>
                <DeleteScheduleButton id={schedule.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
