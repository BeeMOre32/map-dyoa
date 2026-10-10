import { NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cron-auth';
import { scanClipCandidates } from '@/lib/clip-candidate-store';

export const maxDuration = 60;

export async function GET(request: Request) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await scanClipCandidates();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('[cron/clip-candidates]', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'cron failed',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
