import ScheduleModal from '@/components/Calendar/CalendarModal';
import CalendarView from '@/components/Calendar/CalendarView';
import { getAllStreamers, getAllGames, getSchedulesByDateRange } from '@/lib/data-fetching';
import { notFound } from 'next/navigation';

export default async function FullDayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;

  const startKST = new Date(`${date}T00:00:00+09:00`);
  const endKST = new Date(`${date}T23:59:59+09:00`);

  if (isNaN(startKST.getTime())) return notFound();

  // 캐싱된 데이터와 함께 당일 일정 페칭
  const [flattenedDaySchedules, streamers, games] = await Promise.all([
    getSchedulesByDateRange(startKST, endKST),
    getAllStreamers(),
    getAllGames(),
  ]);

  return (
    <>
      {/* 전체 달력 뷰 - daySchedules 그룹으로 표시 */}
      <CalendarView
        games={games}
        initialSchedules={flattenedDaySchedules}
        streamers={streamers}
      />

      {/* 선택된 날짜의 일정 모달 */}
      <ScheduleModal
        selectedDate={startKST}
        schedules={flattenedDaySchedules}
        streamers={streamers}
        games={games}
      />
    </>
  );
}
