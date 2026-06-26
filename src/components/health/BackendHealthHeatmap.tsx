import {
  BACKEND_HEALTH_HEATMAP_DAYS,
  DAY_STATUS_CLASS,
  DAY_STATUS_LABEL,
  formatUptimePercent,
} from '@/lib/backend-health';
import { getBackendHealthHeatmap } from '@/lib/backend-health-store';
import type { BackendHealthCollectionMeta } from '@/lib/backend-health-store';
import type { BackendHealthDayStatus } from '@prisma/client';

function formatKstLabel(dateKst: string): string {
  const [y, m, d] = dateKst.split('-');
  return `${y}. ${m}. ${d}.`;
}

export default async function BackendHealthHeatmap({
  collectionMeta = null,
}: {
  collectionMeta?: BackendHealthCollectionMeta | null;
}) {
  let days;
  try {
    days = await getBackendHealthHeatmap(BACKEND_HEALTH_HEATMAP_DAYS);
  } catch {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        일별 상태 기록 테이블이 아직 없습니다.{' '}
        <code className="text-xs">npm run db:ensure-backend-health</code> 실행 후 Cron이
        돌아가면 데이터가 쌓입니다.
      </div>
    );
  }
  const withData = days.filter((d) => d.hasData);
  const totalChecks = withData.reduce((s, d) => s + d.totalChecks, 0);
  const okChecks = withData.reduce((s, d) => s + d.okChecks, 0);
  const periodUptime = formatUptimePercent(okChecks, totalChecks);
  const noDayData = withData.length === 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            최근 {BACKEND_HEALTH_HEATMAP_DAYS}일 상태 (KST)
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            5분 간격 자동 체크 기준 · 데이터 없는 날은 회색
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
          부터 시작되었습니다. 일별 히트맵은 Cron이 하루치 이상 쌓이면 채워집니다.
        </p>
      )}

      <div className="mt-4 grid grid-cols-10 gap-1.5 sm:gap-2">
        {days.map((day) => {
          const status = day.hasData ? day.status : null;
          const uptime =
            day.hasData && day.totalChecks > 0
              ? formatUptimePercent(day.okChecks, day.totalChecks)
              : null;

          return (
            <div
              key={day.dateKst}
              title={
                day.hasData
                  ? `${formatKstLabel(day.dateKst)} · ${DAY_STATUS_LABEL[status as BackendHealthDayStatus]} · 성공 ${day.okChecks}/${day.totalChecks}${uptime != null ? ` (${uptime}%)` : ''}${day.avgLatencyMs != null ? ` · 평균 ${day.avgLatencyMs}ms` : ''}`
                  : `${formatKstLabel(day.dateKst)} · 기록 없음`
              }
              className={`aspect-square rounded-md transition-colors ${
                status
                  ? DAY_STATUS_CLASS[status]
                  : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          );
        })}
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
