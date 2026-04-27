// src/app/streamers/detail/[id]/page.tsx
import StreamerView from '@/components/streamer/StreamerView';
import StreamerDetailModal from '@/components/streamer/StreamerDetailModal';
import { notFound } from 'next/navigation';
import { getAllStreamers, getStreamerDetail } from '@/lib/data-fetching';

export default async function FullStreamerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [streamers, { schedules, scheduleCount, clipCount }] = await Promise.all([
    getAllStreamers(),
    getStreamerDetail(id),
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
