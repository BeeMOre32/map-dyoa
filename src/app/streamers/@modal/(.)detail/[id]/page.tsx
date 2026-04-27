// src/app/streamers/@modal/(.)detail/[id]/page.tsx
import { prisma } from '@/lib/prisma';
import StreamerDetailModal from '@/components/streamer/StreamerDetailModal';
import { notFound } from 'next/navigation';

export default async function InterceptedStreamerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [streamer, schedules, scheduleCount, clipCount] = await Promise.all([
    prisma.streamer.findUnique({ where: { id } }),
    prisma.schedule.findMany({
      where: { participants: { some: { streamerId: id } } },
      include: {
        game: true,
        participants: { include: { streamer: true } },
      },
      orderBy: { startTime: 'desc' },
      take: 20,
    }),
    prisma.scheduleParticipant.count({ where: { streamerId: id } }),
    prisma.clip.count({ where: { participants: { some: { streamerId: id } } } }),
  ]);

  if (!streamer) return notFound();

  return (
    <StreamerDetailModal
      streamer={streamer}
      schedules={schedules}
      scheduleCount={scheduleCount}
      clipCount={clipCount}
    />
  );
}
