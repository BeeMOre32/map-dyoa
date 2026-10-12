'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { resolveStreamerAvatarSrc } from '@/lib/utils';
import { markModalSoftNav } from '@/lib/modal-navigation';
import type { TodayLiveMember, TodayLiveRow } from '@/lib/calendar/todayLiveListing';

function Face({ member }: { member: TodayLiveMember }) {
  const [failed, setFailed] = useState(false);
  const src = resolveStreamerAvatarSrc({ name: member.name, profileImg: member.profileImg });
  if (failed) {
    return (
      <span
        className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[8px] font-black text-white"
        style={{ background: member.colorCode }}
      >
        {member.name.slice(0, 1)}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      className="h-3.5 w-3.5 shrink-0 rounded-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

function LiveMark() {
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-red-500 px-1.5 py-px">
      <span className="h-1 w-1 animate-ping rounded-full bg-white" />
      <span className="text-[8px] font-black tracking-wide text-white">LIVE</span>
    </span>
  );
}

export default function CalendarTodayLiveList({ rows, now }: { rows: TodayLiveRow[]; now: Date }) {
  if (rows.length === 0) return null;
  const anyLive = rows.some((row) => row.members.some((member) => member.live));

  return (
    <div className="flex flex-col gap-1.5">
      {anyLive ? (
        <p className="px-0.5 text-[10px] font-black text-red-500">지금 {format(now, 'HH:mm')}</p>
      ) : null}
      {rows.map((row) => {
        const live = row.members.some((member) => member.live);
        const className = `block rounded-xl bg-white px-2 py-2 text-left ring-1 dark:bg-slate-950 ${
          live
            ? 'ring-red-200 dark:ring-red-900/70'
            : 'ring-slate-200 dark:ring-slate-700'
        } ${row.scheduleId ? 'cursor-pointer hover:ring-indigo-300 dark:hover:ring-indigo-700' : ''}`;
        const body = (
          <>
          <div className="flex items-start justify-between gap-1">
            <p className="line-clamp-2 text-[12px] font-black leading-snug text-slate-800 dark:text-slate-100">
              {row.title}
            </p>
            {live ? <LiveMark /> : null}
          </div>
          {row.collab ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {row.members.map((member) => (
                <span
                  key={member.id}
                  className={`inline-flex max-w-full items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    member.live
                      ? 'bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <Face member={member} />
                  <span className="truncate">{member.name}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-0.5 truncate text-[10px] font-bold text-slate-500 dark:text-slate-400">
              {row.members[0]?.name}
              {row.category ? ` · ${row.category}` : ''}
            </p>
          )}
          {row.collab && row.category ? (
            <p className="mt-1 truncate text-[10px] font-bold text-slate-400">{row.category}</p>
          ) : null}
          {row.startedAt ? (
            <p className="mt-0.5 text-[10px] font-bold tabular-nums text-slate-400">
              {format(new Date(row.startedAt), 'HH:mm')}–
            </p>
          ) : null}
          </>
        );
        if (!row.scheduleId) {
          return (
            <div key={row.id} className={className}>
              {body}
            </div>
          );
        }
        return (
          <Link
            key={row.id}
            href={`/calendar/schedule/${row.scheduleId}`}
            scroll={false}
            className={className}
            onClick={(event) => {
              event.stopPropagation();
              markModalSoftNav();
            }}
          >
            {body}
          </Link>
        );
      })}
    </div>
  );
}
