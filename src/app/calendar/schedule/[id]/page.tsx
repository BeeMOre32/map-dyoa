// src/app/calendar/schedule/[id]/page.tsx
import ScheduleDetailView from '@/components/Calendar/ScheduleDetailModalWrapper';
import { notFound } from 'next/navigation';
import CalendarView from '@/components/Calendar/CalendarView';
import { getCalendarData, getScheduleDetail, getScheduleClips } from '@/lib/data-fetching';

export default async function FullSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ schedules: allSchedules, streamers, games }, targetSchedule, clips] =
    await Promise.all([
      getCalendarData(),
      getScheduleDetail(id),
      getScheduleClips(id),
    ]);

  if (!targetSchedule) return notFound();

  return (
    <div className="relative w-full h-full min-h-screen">
      <CalendarView
        initialSchedules={allSchedules}
        streamers={streamers}
        games={games}
      />
      <ScheduleDetailView
        schedule={targetSchedule}
        streamers={streamers}
        games={games}
        clips={clips}
      />
    </div>
  );
}
