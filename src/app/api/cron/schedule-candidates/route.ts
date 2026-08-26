import { NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cron-auth';
import { purgeExpiredAppRecords } from '@/lib/app-data-retention';
import { scanLiveScheduleCandidates } from '@/lib/schedule-candidate-store';

export async function GET(request: Request) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await scanLiveScheduleCandidates();
    let purged = { auditLogs: 0, candidates: 0 };
    try {
      purged = await purgeExpiredAppRecords();
    } catch (purgeError) {
      console.error('[cron/schedule-candidates] purge', purgeError);
    }
    return NextResponse.json({
      ok: true,
      ...result,
      purged: { auditLogs: purged.auditLogs, candidates: purged.candidates },
    });
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
