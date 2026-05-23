// src/app/calendar/schedule/[id]/page.tsx
import ScheduleDetailView from '@/components/Calendar/ScheduleDetailModalWrapper';
import ScheduleSeoContent from '@/components/Seo/ScheduleSeoContent';
import { notFound } from 'next/navigation';
import CalendarView from '@/components/Calendar/CalendarView';
import { getCalendarData, getScheduleDetail, getScheduleClips } from '@/lib/data-fetching';
import { buildPageMetadata, formatSocialTitle, withSiteBrand } from '@/lib/site';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const schedule = await getScheduleDetail(id);
  if (!schedule) {
    return buildPageMetadata({ title: '일정을 찾을 수 없음', noIndex: true });
  }
  const members = schedule.participants.map((p) => p.name).join(', ');
  const gameTitle = schedule.game?.title;
  const description = [
    schedule.title,
    gameTitle,
    members ? `참여: ${members}` : null,
    '지도동 방송 일정',
  ]
    .filter(Boolean)
    .join(' · ');
  const ogPath = `/calendar/schedule/${id}/opengraph-image`;
  const pageTitle = withSiteBrand(schedule.title);
  const ogTitle = formatSocialTitle(pageTitle);
  return {
    ...buildPageMetadata({
      title: schedule.title,
      description,
      path: `/calendar/schedule/${id}`,
    }),
    openGraph: {
      title: ogTitle,
      description,
      type: 'website',
      locale: 'ko_KR',
      images: [{ url: ogPath, width: 1200, height: 630, alt: pageTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: [ogPath],
    },
  };
}

export default async function FullSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ schedules: allSchedules, streamers, games }, targetSchedule, clips] =
    await Promise.all([
      getCalendarData(),
      getScheduleDetail(id),
      getScheduleClips(id),
    ]);

  if (!targetSchedule) return notFound();

  return (
    <div className="relative w-full h-full min-h-screen">
      <ScheduleSeoContent schedule={targetSchedule} />
      <CalendarView
        initialSchedules={allSchedules}
        streamers={streamers}
        games={games}
      />
      <ScheduleDetailView
        schedule={targetSchedule}
        streamers={streamers}
        games={games}
        clips={clips}
      />
    </div>
  );
}
