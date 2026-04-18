// src/app/calendar/schedule/[id]/page.tsx
import { prisma } from '@/src/lib/prisma';
import ScheduleDetailView from '@/src/components/Calendar/ScheduleDetailModal'; // 🌟 컴포넌트 이름/경로 확인
import { notFound } from 'next/navigation';
import CalendarView from '@/src/components/Calendar/CalendarView';

export default async function FullSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 1. 모든 데이터 병렬로 가져오기 (성능 최적화)
  const [targetSchedule, allSchedules, streamers, games] = await Promise.all([
    prisma.schedule.findUnique({
      where: { id },
      include: {
        game: true,
        participants: { include: { streamer: true } },
      },
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

  // 🌟 상세 일정이 없으면 404
  if (!targetSchedule) return notFound();

  // 2. 배경 달력용 데이터 가공 (배열)
  const formattedAllSchedules = allSchedules.map((s) => ({
    ...s,
    participants: s.participants.map((p) => p.streamer),
  }));

  // 3. 상세 보기용 데이터 가공 (단일 객체)
  const flattenedTarget = {
    ...targetSchedule,
    participants: targetSchedule.participants.map((p) => p.streamer),
  };

  return (
    <div className="relative w-full h-full min-h-screen">
      <CalendarView
        initialSchedules={formattedAllSchedules}
        streamers={streamers}
        games={games}
      />

      <ScheduleDetailView
        schedule={flattenedTarget}
        streamers={streamers}
        games={games}
      />
    </div>
  );
}
