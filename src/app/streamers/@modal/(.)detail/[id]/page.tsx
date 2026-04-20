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

  // 1. 스트리머 데이터 조회
  const streamer = await prisma.streamer.findUnique({
    where: { id },
  });

  if (!streamer) return notFound();

  // 2. 대형 모달 렌더링
  return <StreamerDetailModal streamer={streamer} />;
}
