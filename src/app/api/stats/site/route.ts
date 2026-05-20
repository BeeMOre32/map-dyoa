import { NextResponse } from 'next/server';
import {
  getAllClips,
  getCalendarData,
  getPublicSiteOverview,
} from '@/lib/data-fetching';
import { computeSiteWideReport } from '@/lib/siteWideStats';

export const revalidate = 300;

export async function GET() {
  const [{ schedules, streamers, games }, overview, clips] = await Promise.all([
    getCalendarData(),
    getPublicSiteOverview(),
    getAllClips(),
  ]);

  const report = computeSiteWideReport({
    schedules,
    clips,
    streamers,
    games,
    overview,
  });

  return NextResponse.json(report, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
