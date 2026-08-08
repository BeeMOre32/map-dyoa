import type { BackendHealthCollectionMeta } from '@/lib/backend-health-store';

function formatKo(d: Date): string {
  return d.toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function BackendHealthCronMeta({
  meta,
}: {
  meta: BackendHealthCollectionMeta | null;
}) {
  if (!meta) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        자동 수집 기록 테이블이 아직 없습니다.{' '}
        <code className="text-xs">npm run db:ensure-backend-health</code> 실행 후 Vercel Cron이
        동작하면 30분 간격으로 쌓입니다.
      </div>
    );
  }

  const collecting = meta.totalSamples === 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">자동 수집 (Cron)</p>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500 dark:text-slate-400">마지막 Cron 실행</dt>
          <dd className="text-right font-medium">
            {meta.lastCronAt ? formatKo(meta.lastCronAt) : '아직 없음'}
            {meta.lastCronOk != null && (
              <span
                className={`ml-1.5 text-xs font-black ${
                  meta.lastCronOk
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                ({meta.lastCronOk ? '성공' : '실패'})
              </span>
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500 dark:text-slate-400">수집 시작</dt>
          <dd className="text-right font-medium">
            {meta.collectionStartedAt ? formatKo(meta.collectionStartedAt) : '—'}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500 dark:text-slate-400">누적 샘플</dt>
          <dd className="font-bold tabular-nums">{meta.totalSamples.toLocaleString('ko-KR')}건</dd>
        </div>
      </dl>
      {collecting && (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium leading-relaxed text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          데이터 수집 중입니다. Vercel Cron이 켜져 있으면 배포 후 <strong>최대 30분</strong> 안에
          첫 기록이 생깁니다. Hobby 플랜은 하루 1회만 실행될 수 있습니다.
        </p>
      )}
    </div>
  );
}
