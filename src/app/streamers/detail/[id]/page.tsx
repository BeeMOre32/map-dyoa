// src/app/streamers/detail/[id]/page.tsx
import { prisma } from '@/lib/prisma';
import StreamerView from '@/components/streamer/StreamerView';
import StreamerDetailModal from '@/components/streamer/StreamerDetailModal';
import { getAllStreamers } from '@/lib/data-fetching';
import { notFound } from 'next/navigation';

export default async function FullStreamerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [streamers, schedules, scheduleCount, clipCount] = await Promise.all([
    getAllStreamers(),
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

  const streamer = streamers.find((s) => s.id === id);
  if (!streamer) return notFound();

  return (
    <>
      <StreamerView streamers={streamers} />
      <StreamerDetailModal
        streamer={streamer}
        schedules={schedules}
        scheduleCount={scheduleCount}
        clipCount={clipCount}
      />
    </>
  );
}
