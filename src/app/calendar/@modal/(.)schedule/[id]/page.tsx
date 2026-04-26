import { prisma } from '@/lib/prisma';
import ScheduleDetailModal from '@/components/Calendar/ScheduleDetailModal';
import { notFound } from 'next/navigation';
import { flattenScheduleParticipants } from '@/lib/schedule-formatters';
import { getAllStreamers, getAllGames } from '@/lib/data-fetching';

export default async function InterceptedSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [schedule, streamers, games, clips] = await Promise.all([
    prisma.schedule.findUnique({
      where: { id },
      include: {
        game: true,
        participants: { include: { streamer: true } },
      },
    }),
    getAllStreamers(),
    getAllGames(),
    prisma.clip.findMany({
      where: { scheduleId: id },
      include: { participants: { include: { streamer: true } } },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  if (!schedule) return notFound();

  const flattenedSchedule = flattenScheduleParticipants(schedule);

  return (
    <ScheduleDetailModal
      schedule={flattenedSchedule}
      streamers={streamers}
      games={games}
      clips={clips}
    />
  );
}
