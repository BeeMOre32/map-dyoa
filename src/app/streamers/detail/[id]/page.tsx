// src/app/streamers/detail/[id]/page.tsx
import { prisma } from '@/src/lib/prisma';
import StreamerView from '@/src/components/streamer/StreamerView'; // 멤버 목록 컴포넌트
import StreamerDetailModal from '@/src/components/streamer/StreamerDetailModal';
import { notFound } from 'next/navigation';

export default async function FullStreamerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const streamers = await prisma.streamer.findMany({
    orderBy: { name: 'asc' },
  });

  const streamer = streamers.find((s) => s.id === id);

  if (!streamer) return notFound();

  return (
    <>
      <StreamerView streamers={streamers} />
      <StreamerDetailModal streamer={streamer} />
    </>
  );
}
