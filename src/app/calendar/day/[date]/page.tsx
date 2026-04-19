import { prisma } from '@/src/lib/prisma';
import ScheduleModal from '@/src/components/Calendar/CalendarModal';
import { notFound } from 'next/navigation';
import CalendarView from '@/src/components/Calendar/CalendarView';

export default async function FullDayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;

  const startKST = new Date(`${date}T00:00:00+09:00`);
  const endKST = new Date(`${date}T23:59:59+09:00`);

  if (isNaN(startKST.getTime())) return notFound();

  const [daySchedules, allSchedules, streamers, games] = await Promise.all([
    prisma.schedule.findMany({
      where: {
        startTime: {
          gte: startKST,
          lte: endKST,
        },
      },
      include: {
        game: true,
        participants: { include: { streamer: true } },
      },
      orderBy: { startTime: 'asc' },
    }),
    prisma.schedule.findMany({
      include: {
        game: true,
        participants: { include: { streamer: true } },
      },
    }),
    prisma.streamer.findMany({ orderBy: { name: 'asc' } }),
    prisma.game.findMany({ orderBy: { title: 'asc' } }),
  ]);

  const flattenedDaySchedules = daySchedules.map((s) => ({
    ...s,
    participants: s.participants.map((p) => p.streamer),
  }));

  const formattedAllSchedules = allSchedules.map((s) => ({
    ...s,
    participants: s.participants.map((p) => p.streamer),
  }));

  return (
    <>
      <CalendarView
        games={games}
        initialSchedules={formattedAllSchedules}
        streamers={streamers}
      />

      <ScheduleModal
        selectedDate={startKST}
        schedules={flattenedDaySchedules}
        streamers={streamers}
        games={games}
      />
    </>
  );
}
