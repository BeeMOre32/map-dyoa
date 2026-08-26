import { NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cron-auth';
import { purgeExpiredAppRecords } from '@/lib/app-data-retention';

async function run(request: Request) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const purged = await purgeExpiredAppRecords();
    return NextResponse.json({ ok: true, ...purged });
  } catch (error) {
    console.error('[cron/db-retention]', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'cron failed',
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
