// src/app/calendar/schedule/[id]/page.tsx
import ScheduleDetailView from '@/components/Calendar/ScheduleDetailModalWrapper';
import { notFound } from 'next/navigation';
import CalendarView from '@/components/Calendar/CalendarView';
import { getCalendarData, getScheduleDetail, getScheduleClips } from '@/lib/data-fetching';
import { buildPageMetadata } from '@/lib/site';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const schedule = await getScheduleDetail(id);
  if (!schedule) {
    return buildPageMetadata({ title: '일정을 찾을 수 없음', noIndex: true });
  }
  const gameTitle = schedule.game?.title;
  const description = gameTitle
    ? `${schedule.title} · ${gameTitle} | 지도동 방송 일정`
    : `${schedule.title} | 지도동 방송 일정`;
  return buildPageMetadata({
    title: schedule.title,
    description,
    path: `/calendar/schedule/${id}`,
  });
}

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
