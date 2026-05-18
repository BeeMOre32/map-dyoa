import { addMonths, subMonths } from 'date-fns';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';
import type { Streamer } from '@prisma/client';
import { absoluteUrl, SITE_NAME } from '@/lib/site';

export function getSitemapScheduleWindow(): { from: Date; to: Date } {
  const now = new Date();
  return {
    from: subMonths(now, 3),
    to: addMonths(now, 6),
  };
}

export function getScheduleEventJsonLd(schedule: FlattenedSchedule) {
  const start = new Date(schedule.startTime);
  const performers = schedule.participants.map((p) => ({
    '@type': 'Person' as const,
    name: p.name,
    url: absoluteUrl(`/streamers/detail/${p.id}`),
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: schedule.title,
    description: schedule.game?.title
      ? `${schedule.title} — ${schedule.game.title} (지도동 방송 일정)`
      : `${schedule.title} (지도동 방송 일정)`,
    startDate: start.toISOString(),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    location: {
      '@type': 'VirtualLocation',
      name: 'CHZZK / YouTube',
      url: schedule.liveUrls?.[0] ?? absoluteUrl(`/calendar/schedule/${schedule.id}`),
    },
    organizer: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: absoluteUrl('/calendar'),
    },
    ...(performers.length > 0 ? { performer: performers } : {}),
    ...(schedule.game?.title
      ? { about: { '@type': 'Thing', name: schedule.game.title } }
      : {}),
    url: absoluteUrl(`/calendar/schedule/${schedule.id}`),
    image: absoluteUrl(`/calendar/schedule/${schedule.id}/opengraph-image`),
  };
}

export function getScheduleBreadcrumbJsonLd(schedule: FlattenedSchedule) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: '방송 일정',
        item: absoluteUrl('/calendar'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: schedule.title,
        item: absoluteUrl(`/calendar/schedule/${schedule.id}`),
      },
    ],
  };
}

export function getStreamerPersonJsonLd(
  streamer: Pick<Streamer, 'id' | 'name' | 'bio' | 'chzzkUrl' | 'youtubeUrl' | 'profileImg'>,
) {
  const sameAs = [streamer.chzzkUrl, streamer.youtubeUrl].filter(
    (u): u is string => typeof u === 'string' && u.trim().length > 0,
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: streamer.name,
    description:
      streamer.bio?.trim() ||
      `${streamer.name}의 지도동 방송 일정·클립·프로필`,
    url: absoluteUrl(`/streamers/detail/${streamer.id}`),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(streamer.profileImg?.trim()
      ? { image: streamer.profileImg.trim() }
      : {}),
  };
}

export function getStreamerBreadcrumbJsonLd(streamer: Pick<Streamer, 'id' | 'name'>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: '멤버',
        item: absoluteUrl('/streamers'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: streamer.name,
        item: absoluteUrl(`/streamers/detail/${streamer.id}`),
      },
    ],
  };
}

export function getCalendarItemListJsonLd(
  schedules: FlattenedSchedule[],
  listName: string,
) {
  const items = schedules.slice(0, 100).map((schedule, index) => ({
    '@type': 'ListItem' as const,
    position: index + 1,
    name: schedule.title,
    url: absoluteUrl(`/calendar/schedule/${schedule.id}`),
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    numberOfItems: items.length,
    itemListElement: items,
  };
}
