// src/app/calendar/page.tsx
import { getCalendarData } from '@/lib/data-fetching';
import CalendarView from '@/components/Calendar/CalendarView';

export default async function CalendarPage() {
  // 캐싱된 데이터 페칭
  //test
  const { schedules, streamers, games } = await getCalendarData();

  return (
    <div className="min-h-dvh bg-slate-50/50 dark:bg-slate-950 transition-colors">
      <CalendarView
        initialSchedules={schedules}
        streamers={streamers}
        games={games}
      />
    </div>
  );
}
