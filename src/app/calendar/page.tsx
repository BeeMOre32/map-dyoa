// src/app/calendar/page.tsx
import { getCalendarData } from '@/lib/data-fetching';
import CalendarView from '@/components/Calendar/CalendarView';
import { buildPageMetadata } from '@/lib/site';

export const metadata = buildPageMetadata({
  title: '방송 일정',
  description: '지도동 멤버 방송·게임 일정을 달력으로 확인하세요.',
  path: '/calendar',
});

export default async function CalendarPage() {
  const { schedules, streamers, games } = await getCalendarData();

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-50/50 transition-colors dark:bg-slate-950">
      <CalendarView
        initialSchedules={schedules}
        streamers={streamers}
        games={games}
      />
    </div>
  );
}
