import ScheduleDetailModal from '@/components/Calendar/ScheduleDetailModalWrapper';
import { notFound } from 'next/navigation';
import { flattenScheduleParticipants } from '@/lib/schedule-formatters';
import { getAllStreamers, getAllGames, getScheduleDetail, getScheduleClips } from '@/lib/data-fetching';

export default async function InterceptedSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [schedule, streamers, games, clips] = await Promise.all([
    getScheduleDetail(id),
    getAllStreamers(),
    getAllGames(),
    getScheduleClips(id),
  ]);

  if (!schedule) return notFound();

  return (
    <ScheduleDetailModal
      schedule={flattenScheduleParticipants(schedule)}
      streamers={streamers}
      games={games}
      clips={clips}
    />
  );
}
