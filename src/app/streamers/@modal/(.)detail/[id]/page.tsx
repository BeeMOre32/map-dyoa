// src/app/streamers/@modal/(.)detail/[id]/page.tsx
import StreamerDetailModal from '@/components/streamer/StreamerDetailModal';
import { notFound } from 'next/navigation';
import { getStreamerById, getStreamerDetail } from '@/lib/data-fetching';

export default async function InterceptedStreamerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [streamer, detail] = await Promise.all([
    getStreamerById(id),
    getStreamerDetail(id),
  ]);

  if (!streamer) return notFound();

  const { schedules, linkedClips, scheduleCount, clipCount } = detail;

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
