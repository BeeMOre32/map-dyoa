// src/app/streamers/detail/[id]/page.tsx
import StreamerDetailModal from '@/components/streamer/StreamerDetailModal';
import StreamerSeoContent from '@/components/Seo/StreamerSeoContent';
import { notFound } from 'next/navigation';
import { getStreamerById, getStreamerDetail } from '@/lib/data-fetching';
import { buildPageMetadata } from '@/lib/site';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const streamer = await getStreamerById(id);
  if (!streamer) {
    return buildPageMetadata({ title: '멤버를 찾을 수 없음', noIndex: true });
  }
  return buildPageMetadata({
    title: `${streamer.name} | 지도동`,
    description: `${streamer.name}의 지도동 방송 일정·치지직·유튜브 클립·프로필을 Map-Dyoa에서 확인하세요.`,
    path: `/streamers/detail/${id}`,
  });
}

export default async function FullStreamerDetailPage({
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
    <div className="flex min-h-0 flex-1 flex-col bg-slate-50/50 p-4 md:p-6 dark:bg-slate-950">
      <StreamerSeoContent
        streamer={streamer}
        scheduleCount={scheduleCount}
        clipCount={clipCount}
      />
      <StreamerDetailModal
        streamer={streamer}
        schedules={schedules}
        linkedClips={linkedClips}
        scheduleCount={scheduleCount}
        clipCount={clipCount}
      />
    </div>
  );
}
