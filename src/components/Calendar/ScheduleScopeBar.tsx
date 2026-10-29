'use client';

import type { ScheduleScope } from '@/lib/schedule-scope';

const SCOPES: { id: ScheduleScope; label: string; title: string }[] = [
  { id: 'both', label: '같이', title: '주요 일정과 스트리머 개인 방송을 함께 봅니다' },
  { id: 'major', label: '주요', title: '두 명 이상이 참여하는 합방·공유 일정' },
  { id: 'personal', label: '개인', title: '스트리머 한 명의 단독 방송' },
];

export default function ScheduleScopeBar({
  scope,
  onScope,
}: {
  scope: ScheduleScope;
  onScope: (scope: ScheduleScope) => void;
}) {
  return (
    <div className="flex shrink-0 items-center">
      <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
        {SCOPES.map((item) => (
          <button
            key={item.id}
            type="button"
            title={item.title}
            onClick={() => onScope(item.id)}
            className={`rounded-md px-2.5 py-1 text-xs font-bold ${
              scope === item.id
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
