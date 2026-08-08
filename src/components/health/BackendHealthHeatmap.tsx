import {
  BACKEND_HEALTH_HEATMAP_DAYS,
  DAY_STATUS_CLASS,
  DAY_STATUS_LABEL,
  formatUptimePercent,
} from '@/lib/backend-health';
import { getBackendHealthFeatureHeatmap } from '@/lib/backend-health-store';
import type { BackendHealthCollectionMeta } from '@/lib/backend-health-store';
import type { BackendHealthDayStatus } from '@prisma/client';

function formatKstShort(dateKst: string): string {
  const [, m, d] = dateKst.split('-');
  return `${Number(m)}/${Number(d)}`;
}

function formatKstLabel(dateKst: string): string {
  const [y, m, d] = dateKst.split('-');
  return `${y}. ${m}. ${d}.`;
}

const LATEST_BADGE: Record<BackendHealthDayStatus, string> = {
  OK: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  DEGRADED: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  DOWN: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

export default async function BackendHealthHeatmap({
  collectionMeta = null,
}: {
  collectionMeta?: BackendHealthCollectionMeta | null;
}) {
  let rows;
  try {
    rows = await getBackendHealthFeatureHeatmap(BACKEND_HEALTH_HEATMAP_DAYS);
  } catch {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        기능별 상태 기록 테이블이 아직 없습니다.{' '}
        <code className="text-xs">npm run db:ensure-backend-health</code> 실행 후 Cron이
        돌아가면 데이터가 쌓입니다.
      </div>
    );
  }

  const allDays = rows.flatMap((r) => r.days.filter((d) => d.hasData));
  const totalChecks = allDays.reduce((s, d) => s + d.totalChecks, 0);
  const okChecks = allDays.reduce((s, d) => s + d.okChecks, 0);
  const periodUptime = formatUptimePercent(okChecks, totalChecks);
  const noDayData = allDays.length === 0;
  const dateKeys = rows[0]?.days.map((d) => d.dateKst) ?? [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            기능별 상태 · 최근 {BACKEND_HEALTH_HEATMAP_DAYS}일 (KST)
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            30분 간격 Cron · 행=기능 · 열=날짜
          </p>
        </div>
        {periodUptime != null && !noDayData && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            기간 가동률 {periodUptime}%
          </span>
        )}
        {noDayData && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            데이터 수집 중
          </span>
        )}
      </div>

      {noDayData && collectionMeta?.collectionStartedAt && (
        <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
          수집은{' '}
          <strong className="text-slate-700 dark:text-slate-300">
            {collectionMeta.collectionStartedAt.toLocaleString('ko-KR')}
          </strong>
          부터 시작되었습니다.
        </p>
      )}

      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[28rem] space-y-2">
          <div
            className="grid items-center gap-1.5"
            style={{
              gridTemplateColumns: `5.5rem repeat(${dateKeys.length}, minmax(0, 1fr)) 3.25rem`,
            }}
          >
            <div />
            {dateKeys.map((key, i) => (
              <div
                key={key}
                className="text-center text-[9px] font-bold tabular-nums text-slate-400 dark:text-slate-500"
                title={formatKstLabel(key)}
              >
                {i === 0 || i === dateKeys.length - 1 || i % 3 === 0
                  ? formatKstShort(key)
                  : ''}
              </div>
            ))}
            <div />
          </div>

          {rows.map((row) => (
            <div
              key={row.feature}
              className="grid items-center gap-1.5"
              style={{
                gridTemplateColumns: `5.5rem repeat(${row.days.length}, minmax(0, 1fr)) 3.25rem`,
              }}
            >
              <div className="truncate text-xs font-black text-slate-700 dark:text-slate-200">
                {row.label}
              </div>
              {row.days.map((day) => {
                const status = day.hasData ? day.status : null;
                const uptime =
                  day.hasData && day.totalChecks > 0
                    ? formatUptimePercent(day.okChecks, day.totalChecks)
                    : null;
                return (
                  <div
                    key={`${row.feature}-${day.dateKst}`}
                    title={
                      day.hasData
                        ? `${row.label} · ${formatKstLabel(day.dateKst)} · ${DAY_STATUS_LABEL[status as BackendHealthDayStatus]} · ${day.okChecks}/${day.totalChecks}${uptime != null ? ` (${uptime}%)` : ''}`
                        : `${row.label} · ${formatKstLabel(day.dateKst)} · 기록 없음`
                    }
                    className={`h-5 rounded-sm transition-colors sm:h-6 ${
                      status
                        ? DAY_STATUS_CLASS[status]
                        : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                );
              })}
              <div className="flex justify-end">
                {row.latestStatus ? (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${LATEST_BADGE[row.latestStatus]}`}
                  >
                    {DAY_STATUS_LABEL[row.latestStatus]}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          정상
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
          저하
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
          장애
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-slate-200 dark:bg-slate-800" />
          기록 없음
        </span>
      </div>
    </div>
  );
}
