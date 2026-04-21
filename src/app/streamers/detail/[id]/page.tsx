// src/app/streamers/detail/[id]/page.tsx
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

  const streamers = await getAllStreamers();
  const streamer = streamers.find((s) => s.id === id);

  if (!streamer) return notFound();

  return (
    <>
      <StreamerView streamers={streamers} />
      <StreamerDetailModal streamer={streamer} />
    </>
  );
}
