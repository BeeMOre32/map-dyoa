// src/app/streamers/page.tsx
import { prisma } from '@/src/lib/prisma';
import StreamerView from '@/src/components/streamer/StreamerView'; // 이미 만드신 멤버 목록 컴포넌트

export default async function StreamersPage() {
  const streamers = await prisma.streamer.findMany({
    orderBy: { name: 'asc' },
  });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50">
      <StreamerView streamers={streamers} />
    </div>
  );
}
