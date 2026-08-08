import Link from 'next/link';
import {
  BACKEND_HEALTH_FEATURE_LABEL,
  probeAllBackendHealthFeatures,
  type BackendHealthProbeResult,
} from '@/lib/backend-health';
import BackendHealthHeatmap from '@/components/health/BackendHealthHeatmap';
import BackendHealthCronMeta from '@/components/health/BackendHealthCronMeta';
import { getBackendHealthCollectionMeta } from '@/lib/backend-health-store';

export default async function HealthPage() {
  const [probes, collectionMeta] = await Promise.all([
    probeAllBackendHealthFeatures(),
    getBackendHealthCollectionMeta(),
  ]);

  return (
    <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 pb-16">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-black">백엔드 Health 체크</h1>
          <Link
            href="/help#backend-health"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            도움말
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            큰 줄기 실시간 상태
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {probes.map((probe: BackendHealthProbeResult) => (
              <li
                key={probe.feature}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
              >
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                    {BACKEND_HEALTH_FEATURE_LABEL[probe.feature]}
                  </p>
                  <p className="truncate font-mono text-[10px] text-slate-400">
                    /health/{probe.feature}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
                      probe.ok
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                    }`}
                  >
                    {probe.ok ? '정상' : '오류'}
                  </span>
                  <p className="mt-0.5 text-[10px] font-bold tabular-nums text-slate-500">
                    {typeof probe.latencyMs === 'number' ? `${probe.latencyMs}ms` : '—'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <BackendHealthCronMeta meta={collectionMeta} />

        <BackendHealthHeatmap collectionMeta={collectionMeta} />

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-2 text-sm font-bold text-slate-600 dark:text-slate-300">
            실시간 프로브 요약
          </p>
          <pre className="overflow-x-auto rounded-xl bg-slate-100 p-3 text-xs text-slate-700 dark:bg-slate-950 dark:text-slate-300">
            {JSON.stringify(
              probes.map((p) => ({
                feature: p.feature,
                ok: p.ok,
                statusCode: p.statusCode,
                latencyMs: p.latencyMs,
                error: p.error,
              })),
              null,
              2,
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
