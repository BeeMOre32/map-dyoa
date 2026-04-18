import { prisma } from '@/src/lib/prisma';
import ScheduleDetailModal from '@/src/components/Calendar/ScheduleDetailModal';
import { notFound } from 'next/navigation';

export default async function InterceptedSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const schedule = await prisma.schedule.findUnique({
    where: { id },
    include: {
      game: true,
      participants: { include: { streamer: true } },
    },
  });

  if (!schedule) return notFound();

  const streamers = await prisma.streamer.findMany({
    orderBy: { name: 'asc' },
  });

  const games = await prisma.game.findMany({
    orderBy: { title: 'asc' },
  });

  const flattenedSchedule = {
    ...schedule,
    participants: schedule.participants.map((p) => p.streamer),
  };

  return (
    <ScheduleDetailModal
      schedule={flattenedSchedule}
      streamers={streamers}
      games={games}
    />
  );
}
