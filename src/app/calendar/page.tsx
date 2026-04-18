// src/app/calendar/page.tsx
import { prisma } from '@/src/lib/prisma';
import CalendarView from '@/src/components/Calendar/CalendarView';

export default async function CalendarPage() {
  const schedules = await prisma.schedule.findMany({
    include: {
      game: true,
      participants: {
        include: { streamer: true },
      },
    },
  });

  const streamers = await prisma.streamer.findMany({
    orderBy: { name: 'asc' },
  });

  const games = await prisma.game.findMany({
    orderBy: { title: 'asc' },
  });

  const formattedSchedules = schedules.map((schedule) => ({
    ...schedule,
    participants: schedule.participants.map((p) => p.streamer),
  }));

  return (
    <div className="min-h-screen bg-slate-50/50">
      <CalendarView
        initialSchedules={formattedSchedules}
        streamers={streamers}
        games={games}
      />
    </div>
  );
}
