import { NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cron-auth';
import { runBackendHealthCron } from '@/lib/backend-health-store';

export async function GET(request: Request) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await runBackendHealthCron();
    const failed = result.probes.filter((p) => !p.ok).map((p) => p.feature);
    return NextResponse.json({
      ok: true,
      probeOk: failed.length === 0,
      failedFeatures: failed,
      dateKst: result.dateKst,
      features: result.rollups.map((r) => ({
        feature: r.feature,
        status: r.status,
        totalChecks: r.totalChecks,
        okChecks: r.okChecks,
      })),
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
