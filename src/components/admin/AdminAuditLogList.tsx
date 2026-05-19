'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { AuditLogRow } from '@/lib/data-fetching';
import {
  formatAuditChangesDetail,
  getEntityLabel,
  type AuditFormatContext,
} from '@/lib/format-audit-changes';

type ActionFilter = 'update' | 'create' | 'delete' | 'all';

const FILTERS: { id: ActionFilter; label: string }[] = [
  { id: 'update', label: '수정' },
  { id: 'create', label: '생성' },
  { id: 'delete', label: '삭제' },
  { id: 'all', label: '전체' },
];

const ACTION_LABEL: Record<string, string> = {
  create: '생성',
  update: '수정',
  delete: '삭제',
};

const ACTION_STYLE: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  update: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  delete: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
};

function filterHref(action: ActionFilter) {
  return action === 'update' ? '/admin/audit' : `/admin/audit?action=${action}`;
}

function ChangeDetailList({
  entity,
  action,
  changes,
  formatCtx,
}: {
  entity: string;
  action: string;
  changes: unknown;
  formatCtx: AuditFormatContext;
}) {
  const details = formatAuditChangesDetail(entity, action, changes, formatCtx);
  const hasLegacy = details.some((d) => d.legacyOnly);

  if (details.length === 0) {
    return (
      <p className="mt-2 text-xs font-medium text-slate-400">기록된 변경 필드가 없습니다.</p>
    );
  }

  return (
    <div className="mt-3 border-t border-slate-100 dark:border-slate-800 pt-3">
      {hasLegacy && (
        <p className="mb-2 text-[11px] font-bold text-amber-600 dark:text-amber-400">
          이전 값은 기록되지 않았습니다. 저장 당시 내용만 표시됩니다.
        </p>
      )}
      <ul className="space-y-2.5">
        {details.map((line) => (
          <li key={line.label} className="text-xs">
            <span className="block font-black text-slate-500 dark:text-slate-400 mb-0.5">
              {line.label}
            </span>
            {line.before != null && line.before !== line.after && !line.legacyOnly ? (
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-2">
                <span className="rounded-md bg-rose-50 dark:bg-rose-950/40 px-2 py-1 font-medium text-rose-800 dark:text-rose-200 line-through decoration-rose-300/80 break-words">
                  {line.before}
                </span>
                <span className="hidden sm:inline text-slate-300 font-bold shrink-0">→</span>
                <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 font-medium text-emerald-900 dark:text-emerald-100 break-words">
                  {line.after}
                </span>
              </div>
            ) : (
              <span className="block rounded-md bg-slate-50 dark:bg-slate-800/60 px-2 py-1 font-medium text-slate-800 dark:text-slate-100 break-words">
                {line.after}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AuditLogCard({
  log,
  formatCtx,
}: {
  log: AuditLogRow;
  formatCtx: AuditFormatContext;
}) {
  const actionStyle =
    ACTION_STYLE[log.action] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

  return (
    <article className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <time className="font-semibold tabular-nums">
          {format(new Date(log.createdAt), 'M/d HH:mm', { locale: ko })}
        </time>
        <span className={`rounded-md px-2 py-0.5 font-black ${actionStyle}`}>
          {ACTION_LABEL[log.action] ?? log.action}
        </span>
        <span className="font-bold text-slate-400">{getEntityLabel(log.entity)}</span>
        {log.actorUserId && (
          <span
            className="ml-auto truncate max-w-40 font-mono text-[10px] sm:max-w-xs sm:text-xs"
            title={log.actorUserId}
          >
            {log.actorUserId}
          </span>
        )}
      </div>

      <h2 className="mt-2 text-sm font-black text-slate-900 dark:text-white leading-snug">
        {log.entity === 'schedule' && log.entityId ? (
          <Link
            href={`/calendar/schedule/${log.entityId}`}
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {log.summary}
          </Link>
        ) : (
          log.summary
        )}
      </h2>

      <ChangeDetailList
        entity={log.entity}
        action={log.action}
        changes={log.changes}
        formatCtx={formatCtx}
      />
    </article>
  );
}

export default function AdminAuditLogList({
  logs,
  actionFilter,
  formatCtx,
}: {
  logs: AuditLogRow[];
  actionFilter: ActionFilter;
  formatCtx: AuditFormatContext;
}) {
  const filterDescription =
    actionFilter === 'update'
      ? '수정된 항목과 변경 전·후 내용을 표시합니다'
      : actionFilter === 'all'
        ? '생성·수정·삭제 전체'
        : `${ACTION_LABEL[actionFilter] ?? actionFilter} 기록`;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">변경 이력</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            {filterDescription}
          </p>
        </div>
        <Link
          href="/admin/schedules"
          className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          ← 일정 관리
        </Link>
      </div>

      <nav
        className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80"
        aria-label="이력 필터"
      >
        {FILTERS.map(({ id, label }) => {
          const active = actionFilter === id;
          return (
            <Link
              key={id}
              href={filterHref(id)}
              className={`rounded-lg px-3.5 py-2 text-sm font-black transition-colors ${
                active
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {logs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center text-sm font-bold text-slate-400">
          {actionFilter === 'update'
            ? '수정 이력이 없습니다.'
            : '해당 조건의 이력이 없습니다.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {logs.map((log) => (
            <li key={log.id}>
              <AuditLogCard log={log} formatCtx={formatCtx} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
