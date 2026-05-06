// src/app/streamers/@modal/(.)detail/[id]/page.tsx
import StreamerDetailModal from '@/components/streamer/StreamerDetailModal';
import { notFound } from 'next/navigation';
import { getAllStreamers, getStreamerDetail } from '@/lib/data-fetching';

export default async function InterceptedStreamerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [streamers, { schedules, linkedClips, scheduleCount, clipCount }] = await Promise.all([
    getAllStreamers(),
    getStreamerDetail(id),
  ]);

  const streamer = streamers.find((s) => s.id === id);
  if (!streamer) return notFound();

  return (
    <StreamerDetailModal
      streamer={streamer}
      schedules={schedules}
      linkedClips={linkedClips}
      scheduleCount={scheduleCount}
      clipCount={clipCount}
    />
  );
}
