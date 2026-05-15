import type { MetadataRoute } from 'next';
import { getMemberStreamers } from '@/lib/data-fetching';
import { absoluteUrl } from '@/lib/site';

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: absoluteUrl('/calendar'), changeFrequency: 'hourly', priority: 1 },
  { url: absoluteUrl('/streamers'), changeFrequency: 'daily', priority: 0.9 },
  { url: absoluteUrl('/clips'), changeFrequency: 'daily', priority: 0.85 },
  { url: absoluteUrl('/hoi4'), changeFrequency: 'weekly', priority: 0.7 },
  { url: absoluteUrl('/announcements'), changeFrequency: 'weekly', priority: 0.6 },
  { url: absoluteUrl('/help'), changeFrequency: 'monthly', priority: 0.5 },
  { url: absoluteUrl('/privacy'), changeFrequency: 'yearly', priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let streamerRoutes: MetadataRoute.Sitemap = [];

  try {
    const streamers = await getMemberStreamers();
    streamerRoutes = streamers.map((s) => ({
      url: absoluteUrl(`/streamers/detail/${s.id}`),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }));
  } catch {
    // sitemap 생성 실패 시 정적 경로만 제공
  }

  return [...STATIC_ROUTES, ...streamerRoutes];
}
