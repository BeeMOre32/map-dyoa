'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Medal, Pencil } from 'lucide-react';
import type { Hoi4GermanExamEntry } from '@/config/hoi4GermanExam2026';
import type { ExamLeaderboardRow, Hoi4GermanExamViewModel } from '@/lib/hoi4GermanExam';
import { entryMapFromList } from '@/lib/hoi4-exam-entries';
import { markModalSoftNav } from '@/lib/modal-navigation';
import StreamerAvatar from '@/components/streamer/StreamerAvatar';
import ExamEntryEditModal from '@/components/time-attack/ExamEntryEditModal';
import { cn, getStreamerImagePath } from '@/lib/utils';

type Props = {
  examId: string | null;
  model: Hoi4GermanExamViewModel;
  canOperate: boolean;
  entries: Hoi4GermanExamEntry[];
  onEntriesChange: (entries: Hoi4GermanExamEntry[]) => void;
};

const RANK_STYLE: Record<number, string> = {
  1: 'text-amber-600 dark:text-amber-400',
  2: 'text-slate-500 dark:text-slate-400',
  3: 'text-orange-700 dark:text-orange-400',
};

function RecordCell({ row }: { row: ExamLeaderboardRow }) {
  if (!row.clearGameDate && !row.playTime) {
    return (
      <span className="text-sm font-bold text-slate-300 dark:text-slate-600">—</span>
    );
  }

  return (
    <div className="text-right">
      <p className="text-sm font-black tabular-nums text-slate-800 dark:text-slate-100">
        {row.clearGameDate ?? '—'}
      </p>
      {row.playTime ? (
        <p className="mt-0.5 text-[11px] font-bold tabular-nums text-amber-700 dark:text-amber-400">
          {row.playTime}
          {row.clearedAtKst ? (
            <span className="ml-1 font-medium text-slate-400 dark:text-slate-500">
              · {row.clearedAtKst}
            </span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

function RankCell({
  row,
  showRank,
}: {
  row: ExamLeaderboardRow;
  showRank: boolean;
}) {
  const rankStyle = row.rank != null ? RANK_STYLE[row.rank] : undefined;

  return (
    <div className="flex w-8 shrink-0 items-center justify-center" aria-hidden={!showRank}>
      {!showRank ? null : row.rank != null && row.rank <= 3 ? (
        <Medal className={cn('h-4 w-4', rankStyle)} />
      ) : (
        <span className="text-sm font-black tabular-nums text-slate-400">
          {row.rank ?? '—'}
        </span>
      )}
    </div>
  );
}

export default function ExamLeaderboard({
  examId,
  model,
  canOperate,
  entries,
  onEntriesChange,
}: Props) {
  const [editingRow, setEditingRow] = useState<ExamLeaderboardRow | null>(null);
  const entryMap = useMemo(() => entryMapFromList(entries), [entries]);

  const showRank = model.phase !== 'before';
  const showVod = model.phase === 'after' || model.phase === 'live';
  const showClearedBadge = model.phase === 'live';

  if (model.participantCount === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-200/80 bg-amber-50/40 px-4 py-10 text-center dark:border-amber-900/40 dark:bg-amber-950/15">
        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
          연동된 일정이 없거나 참가 멤버가 없습니다.
        </p>
        <p className="mt-1 text-xs font-medium text-slate-400 dark:text-slate-500">
          호이고사 일정에 참가자를 등록해 주세요.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {model.rows.map((row) => (
          <div
            key={row.streamerId}
            className={cn(
              'group flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900',
              row.rank === 1 &&
                showRank &&
                'border-amber-200/80 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/30',
            )}
          >
            <RankCell row={row} showRank={showRank} />

            <Link
              href={`/streamers/detail/${row.streamerId}`}
              scroll={false}
              onClick={markModalSoftNav}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <StreamerAvatar
                name={row.name}
                imgSrc={row.profileImg ?? getStreamerImagePath(row.name)}
                colorCode={row.colorCode}
                streamerId={row.streamerId}
                size="xs"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-slate-800 group-hover:text-amber-700 dark:text-slate-100 dark:group-hover:text-amber-400">
                  {row.name}
                </p>
                {showClearedBadge && row.hasRecord ? (
                  <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    클리어
                  </span>
                ) : null}
              </div>
            </Link>

            <div className="shrink-0">
              {showRank ? (
                <RecordCell row={row} />
              ) : (
                <span className="text-xs font-bold text-slate-300 dark:text-slate-600">—</span>
              )}
            </div>

            {showVod && row.vodUrl ? (
              <a
                href={row.vodUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
              >
                VOD
              </a>
            ) : null}

            {canOperate ? (
              <button
                type="button"
                onClick={() => setEditingRow(row)}
                className="shrink-0 rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-amber-300 hover:text-amber-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-amber-800 dark:hover:text-amber-400"
                aria-label={`${row.name} 기록 ${row.hasRecord ? '수정' : '등록'}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        ))}

        {showRank ? (
          <p className="px-1 pt-1 text-center text-[11px] font-medium text-slate-400 dark:text-slate-500 sm:text-left">
            게임 날짜 빠른 순 → 동률 시 플레이 시간 짧은 순
          </p>
        ) : null}

        {canOperate ? (
          <p className="px-1 text-center text-[10px] font-medium text-slate-400 dark:text-slate-500 sm:text-left">
            연필 버튼으로 클리어 기록을 등록·수정할 수 있습니다.
          </p>
        ) : null}
      </div>

      {editingRow && examId ? (
        <ExamEntryEditModal
          examId={examId}
          row={editingRow}
          entry={entryMap.get(editingRow.streamerId)}
          onClose={() => setEditingRow(null)}
          onSaved={onEntriesChange}
        />
      ) : null}
    </>
  );
}
