// src/app/calendar/@modal/(.)day/[date]/page.tsx
import ScheduleModal from '@/components/Calendar/CalendarModal';
import { getSchedulesByDateRange, getAllStreamers, getAllGames } from '@/lib/data-fetching';
import { notFound } from 'next/navigation';

export default async function InterceptedDayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;

  const startKST = new Date(`${date}T00:00:00+09:00`);
  const endKST = new Date(`${date}T23:59:59+09:00`);

  if (isNaN(startKST.getTime())) return notFound();

  const [schedules, streamers, games] = await Promise.all([
    getSchedulesByDateRange(startKST, endKST),
    getAllStreamers(),
    getAllGames(),
  ]);

  return (
    <ScheduleModal
      selectedDate={startKST}
      schedules={schedules}
      streamers={streamers}
      games={games}
    />
  );
}
