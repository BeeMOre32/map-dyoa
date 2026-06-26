import { NextResponse } from 'next/server';
import { runBackendHealthCron } from '@/lib/backend-health-store';

function verifyCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV === 'development';
  }
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await runBackendHealthCron();
    return NextResponse.json({
      ok: true,
      probeOk: result.probe.ok,
      dateKst: result.dateKst,
      status: result.rollup.status,
      purged: result.purged,
      alertCreated: result.alertCreated,
    });
  } catch (error) {
    console.error('[cron/backend-health]', error);
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
