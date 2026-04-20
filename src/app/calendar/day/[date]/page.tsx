import { prisma } from '@/src/lib/prisma';
import ScheduleModal from '@/src/components/Calendar/CalendarModal';
import { notFound } from 'next/navigation';
import CalendarView from '@/src/components/Calendar/CalendarView';

// 🌟 프로덕션 환경에서 캐시 때문에 데이터가 안 나오는 현상 방지
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function FullDayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;

  const startKST = new Date(`${date}T00:00:00+09:00`);
  const endKST = new Date(`${date}T23:59:59+09:00`);

  if (isNaN(startKST.getTime())) return notFound();

  const [daySchedules, allSchedules, streamers, games] = await Promise.all([
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
    prisma.schedule.findMany({
      include: {
        game: true,
        participants: { include: { streamer: true } },
      },
    }),
    prisma.streamer.findMany({ orderBy: { name: 'asc' } }),
    prisma.game.findMany({ orderBy: { title: 'asc' } }),
  ]);

  // 🔍 서버 로그 확인 (배포 후 Vercel 로그 탭에서 'Found: 3'이 찍히는지 확인하세요)
  console.log(
    `[FullDayPage] Date: ${date} | Day Schedules Found: ${daySchedules.length}`,
  );

  // 3. 데이터 평탄화 (Flattening) 및 타입 복구
  // 'string' -> 'Date' 타입 에러를 막기 위해 new Date()로 다시 감쌉니다.
  const flattenedDaySchedules = daySchedules.map((s) => ({
    ...s,
    startTime: new Date(s.startTime),
    endTime: s.endTime ? new Date(s.endTime) : null,
    createdAt: new Date(s.createdAt),
    participants: s.participants
      .map((p) => p.streamer)
      .filter((streamer) => streamer !== null),
  }));

  const formattedAllSchedules = allSchedules.map((s) => ({
    ...s,
    startTime: new Date(s.startTime),
    endTime: s.endTime ? new Date(s.endTime) : null,
    createdAt: new Date(s.createdAt),
    participants: s.participants
      .map((p) => p.streamer)
      .filter((streamer) => streamer !== null),
  }));

  console.log('[FullDayPage] Flattened Day Schedules:', flattenedDaySchedules);

  return (
    <>
      {/* 전체 달력 뷰 */}
      <CalendarView
        games={games}
        initialSchedules={formattedAllSchedules}
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
