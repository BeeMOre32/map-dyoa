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
  // 캐싱된 데이터 페칭
  //test
  const { schedules, streamers, games } = await getCalendarData();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 dark:bg-slate-950 transition-colors">
      <CalendarView
        initialSchedules={schedules}
        streamers={streamers}
        games={games}
      />
    </div>
  );
}
