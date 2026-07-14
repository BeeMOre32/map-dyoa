import { NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cron-auth';
import { scanLiveScheduleCandidates } from '@/lib/schedule-candidate-store';

export async function GET(request: Request) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await scanLiveScheduleCandidates();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('[cron/schedule-candidates]', error);
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
