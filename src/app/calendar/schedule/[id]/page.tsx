// src/app/calendar/schedule/[id]/page.tsx
import { prisma } from '@/lib/prisma';
import ScheduleDetailView from '@/components/Calendar/ScheduleDetailModal';
import { notFound } from 'next/navigation';
import CalendarView from '@/components/Calendar/CalendarView';
import { flattenScheduleParticipants } from '@/lib/schedule-formatters';
import { getCalendarData } from '@/lib/data-fetching';

export default async function FullSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 캘린더 배경 데이터는 캐시에서, 상세 일정만 DB 직접 조회 (최신 보장)
  const [{ schedules: allSchedules, streamers, games }, targetSchedule] =
    await Promise.all([
      getCalendarData(),
      prisma.schedule.findUnique({
        where: { id },
        include: {
          game: true,
          participants: { include: { streamer: true } },
        },
      }),
    ]);

  if (!targetSchedule) return notFound();

  const flattenedTarget = flattenScheduleParticipants(targetSchedule);

  return (
    <div className="relative w-full h-full min-h-screen">
      <CalendarView
        initialSchedules={allSchedules}
        streamers={streamers}
        games={games}
      />

      <ScheduleDetailView
        schedule={flattenedTarget}
        streamers={streamers}
        games={games}
      />
    </div>
  );
}
