// src/app/calendar/day/[date]/page.tsx
import { prisma } from '@/src/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

import ScheduleModal from '@/src/components/Calendar/CalendarModal';
import { notFound } from 'next/navigation';
import CalendarView from '@/src/components/Calendar/CalendarView';

export default async function FullDayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const targetDate = new Date(date);

  if (isNaN(targetDate.getTime())) return notFound();

  const daySchedules = await prisma.schedule.findMany({
    where: {
      startTime: { gte: startOfDay(targetDate), lte: endOfDay(targetDate) },
    },
    include: {
      game: true,
      participants: { include: { streamer: true } },
    },
    orderBy: { startTime: 'asc' },
  });

  const flattenedDaySchedules = daySchedules.map((s) => ({
    ...s,
    participants: s.participants.map((p) => p.streamer),
  }));

  const streamers = await prisma.streamer.findMany({
    orderBy: { name: 'asc' },
  });

  const games = await prisma.game.findMany({
    orderBy: { title: 'asc' },
  });

  return (
    <>
      <CalendarView
        games={games}
        initialSchedules={flattenedDaySchedules}
        streamers={streamers}
      />
      <ScheduleModal
        selectedDate={targetDate}
        schedules={flattenedDaySchedules}
        streamers={streamers}
        games={games}
      />
    </>
  );
}
