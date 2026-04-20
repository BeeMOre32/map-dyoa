// src/app/calendar/@modal/(.)day/[date]/page.tsx
import { prisma } from '@/src/lib/prisma';
import ScheduleModal from '@/src/components/Calendar/CalendarModal';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function InterceptedDayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const resolvedParams = await params;
  const { date } = resolvedParams;

  const startKST = new Date(`${date}T00:00:00+09:00`);
  const endKST = new Date(`${date}T23:59:59+09:00`);

  if (isNaN(startKST.getTime())) {
    return notFound();
  }

  const [schedulesData, streamers, games] = await Promise.all([
    prisma.schedule.findMany({
      where: {
        startTime: {
          gte: startKST,
          lte: endKST,
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
    }),
    prisma.streamer.findMany({
      orderBy: { name: 'asc' },
    }),
    prisma.game.findMany({
      orderBy: { title: 'asc' },
    }),
  ]);

  const flattenedSchedules = schedulesData.map((s) => ({
    ...s,
    startTime: new Date(s.startTime),
    endTime: s.endTime ? new Date(s.endTime) : null,
    createdAt: new Date(s.createdAt),
    participants: s.participants
      .map((p) => p.streamer)
      .filter((streamer) => streamer !== null),
  }));

  return (
    <ScheduleModal
      selectedDate={startKST}
      schedules={flattenedSchedules}
      streamers={streamers}
      games={games}
    />
  );
}
