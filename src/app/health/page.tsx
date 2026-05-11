import Link from 'next/link';

type HealthPayload = {
  ok?: boolean;
  db?: string;
  status?: string;
  service?: string;
};

async function getBackendHealth() {
  const healthUrl =
    process.env.BACKEND_HEALTH_URL ??
    process.env.NEXT_PUBLIC_BACKEND_HEALTH_URL ??
    'https://map-dyoa-server.fly.dev';

  const start = Date.now();

  try {
    const response = await fetch(healthUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    const latencyMs = Date.now() - start;

    let payload: HealthPayload | null = null;
    try {
      payload = (await response.json()) as HealthPayload;
    } catch {
      payload = null;
    }

    return {
      healthUrl,
      latencyMs,
      statusCode: response.status,
      ok: response.ok,
      payload,
      fetchedAt: new Date().toISOString(),
      error: null as string | null,
    };
  } catch (error) {
    return {
      healthUrl,
      latencyMs: null as number | null,
      statusCode: null as number | null,
      ok: false,
      payload: null as HealthPayload | null,
      fetchedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'health check 실패',
    };
  }
}

export default async function HealthPage() {
  const result = await getBackendHealth();

  return (
    <div className="min-h-screen bg-white px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-black">백엔드 Health 체크</h1>
          <Link
            href="/announcements#backend-split-2026-05"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            공지로 돌아가기
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">서버 상태</p>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-black ${
                result.ok
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
              }`}
            >
              {result.ok ? '정상' : '오류'}
            </span>
          </div>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">체크 URL</dt>
              <dd className="break-all text-right font-mono text-xs">{result.healthUrl}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">HTTP 상태 코드</dt>
              <dd className="font-bold">{result.statusCode ?? '-'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">응답 지연</dt>
              <dd className="font-bold">
                {typeof result.latencyMs === 'number' ? `${result.latencyMs}ms` : '-'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">확인 시각</dt>
              <dd className="font-medium">{new Date(result.fetchedAt).toLocaleString('ko-KR')}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-2 text-sm font-bold text-slate-600 dark:text-slate-300">응답 본문</p>
          <pre className="overflow-x-auto rounded-xl bg-slate-100 p-3 text-xs text-slate-700 dark:bg-slate-950 dark:text-slate-300">
            {JSON.stringify(
              {
                ok: result.ok,
                payload: result.payload,
                error: result.error,
              },
              null,
              2,
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
