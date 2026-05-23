import type { MetadataRoute } from 'next';
import { getMemberStreamers, getSchedulesForSitemap } from '@/lib/data-fetching';
import { absoluteUrl } from '@/lib/site';

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: absoluteUrl('/calendar'), changeFrequency: 'hourly', priority: 1 },
  { url: absoluteUrl('/calendar/monthly'), changeFrequency: 'daily', priority: 0.85 },
  { url: absoluteUrl('/streamers'), changeFrequency: 'daily', priority: 0.9 },
  { url: absoluteUrl('/clips'), changeFrequency: 'daily', priority: 0.85 },
  { url: absoluteUrl('/hoi4'), changeFrequency: 'weekly', priority: 0.7 },
  { url: absoluteUrl('/announcements'), changeFrequency: 'weekly', priority: 0.6 },
  { url: absoluteUrl('/help'), changeFrequency: 'monthly', priority: 0.5 },
  { url: absoluteUrl('/privacy'), changeFrequency: 'yearly', priority: 0.3 },
];

function scheduleSitemapPriority(startTime: Date | string): number {
  const now = Date.now();
  const t = new Date(startTime).getTime();
  if (t >= now) return 0.85;
  if (t >= now - 14 * 24 * 60 * 60 * 1000) return 0.7;
  return 0.55;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let streamerRoutes: MetadataRoute.Sitemap = [];
  let scheduleRoutes: MetadataRoute.Sitemap = [];

  try {
    const streamers = await getMemberStreamers();
    streamerRoutes = streamers.map((s) => ({
      url: absoluteUrl(`/streamers/detail/${s.id}`),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }));
  } catch {
    // 스트리머 조회 실패 시 정적 경로만 유지
  }

  try {
    const schedules = await getSchedulesForSitemap();
    const now = Date.now();
    scheduleRoutes = schedules.map((s) => {
      const start = new Date(s.startTime);
      const created =
        s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt);
      const changeFrequency: 'daily' | 'weekly' =
        start.getTime() >= now ? 'daily' : 'weekly';
      return {
        url: absoluteUrl(`/calendar/schedule/${s.id}`),
        lastModified: created,
        changeFrequency,
        priority: scheduleSitemapPriority(s.startTime),
      };
    });
  } catch {
    // 일정 조회 실패 시 스트리머·정적 경로만 유지
  }

  return [...STATIC_ROUTES, ...streamerRoutes, ...scheduleRoutes];
}
