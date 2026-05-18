// src/app/calendar/page.tsx
import { getCalendarData } from '@/lib/data-fetching';
import CalendarView from '@/components/Calendar/CalendarView';
import CalendarSeoIndex from '@/components/Calendar/CalendarSeoIndex';
import { buildPageMetadata } from '@/lib/site';

export const metadata = buildPageMetadata({
  title: '지도동 방송 일정',
  description:
    '지도동 멤버의 치지직·유튜브 방송·게임 일정을 캘린더와 목록으로 확인하세요. 예정·최근 스트리밍 일정이 자동으로 갱신됩니다.',
  path: '/calendar',
});

export default async function CalendarPage() {
  const { schedules, streamers, games } = await getCalendarData();

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-50/50 transition-colors dark:bg-slate-950">
      <header className="sr-only">
        <h1>지도동 방송 일정 캘린더</h1>
        <p>
          Map-Dyoa에서 지도동 스트리머 방송·게임 일정을 한눈에 확인합니다.
        </p>
      </header>
      <CalendarView
        initialSchedules={schedules}
        streamers={streamers}
        games={games}
      />
      <CalendarSeoIndex schedules={schedules} />
    </div>
  );
}
