// src/app/calendar/@modal/(.)day/[date]/page.tsx
import { prisma } from '@/src/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';
import ScheduleModal from '@/src/components/Calendar/CalendarModal';
import { notFound } from 'next/navigation';

export default async function InterceptedDayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const resolvedParams = await params;
  const { date } = resolvedParams;

  const targetDate = new Date(date);

  if (isNaN(targetDate.getTime())) {
    return notFound();
  }

  const schedulesData = await prisma.schedule.findMany({
    where: {
      startTime: {
        gte: startOfDay(targetDate),
        lte: endOfDay(targetDate),
      },
    },
    include: {
      game: true,
      participants: {
        include: {
          streamer: true,
        },
      },
    },
    orderBy: {
      startTime: 'asc',
    },
  });

  const flattenedSchedules = schedulesData.map((s) => ({
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
    <ScheduleModal
      selectedDate={targetDate}
      schedules={flattenedSchedules}
      streamers={streamers}
      games={games}
    />
  );
}
