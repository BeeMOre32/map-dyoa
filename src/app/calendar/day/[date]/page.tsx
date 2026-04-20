import { prisma } from '@/lib/prisma';
import ScheduleModal from '@/components/Calendar/CalendarModal';
import CalendarView from '@/components/Calendar/CalendarView';
import {
  flattenSchedules,
  filterSchedulesByDate,
} from '@/lib/schedule-formatters';
import { getAllStreamers, getAllGames } from '@/lib/data-fetching';
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
  const [daySchedules, streamers, games] = await Promise.all([
    prisma.schedule.findMany({
      where: {
        startTime: {
          gte: startKST,
          lte: endKST,
        },
      },
      include: {
        game: true,
        participants: { include: { streamer: true } },
      },
      orderBy: { startTime: 'asc' },
    }),
    getAllStreamers(),
    getAllGames(),
  ]);

  // 포맷팅 함수 사용
  const flattenedDaySchedules = flattenSchedules(daySchedules);

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
