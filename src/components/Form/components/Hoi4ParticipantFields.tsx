'use client';

import type { ParticipantEntry, Game, Streamer } from '../types';
import { nationEntryParticipants } from '@/lib/hoi4/hoi4FormUtils';

type Hoi4ParticipantFieldsProps = {
  isHoi4Game: boolean;
  isNaeJeon: boolean;
  onSetIsNaeJeon: (value: boolean) => void;
  participants: ParticipantEntry[];
  streamers: Pick<Streamer, 'id' | 'name'>[];
  onUpdateParticipant: (id: string, field: 'nation', value: string) => void;
  compact?: boolean;
};

export default function Hoi4ParticipantFields({
  isHoi4Game,
  isNaeJeon,
  onSetIsNaeJeon,
  participants,
  streamers,
  onUpdateParticipant,
  compact = false,
}: Hoi4ParticipantFieldsProps) {
  if (!isHoi4Game) return null;

  const rows = nationEntryParticipants(isNaeJeon, participants);
  const streamerMap = new Map(streamers.map((s) => [s.id, s]));

  return (
    <>
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-900/15">
        <div>
          <p className="text-sm font-bold text-amber-700 dark:text-amber-400">내전 세션</p>
          <p className="mt-0.5 text-xs font-medium text-amber-500 dark:text-amber-600">
            체크하거나 국가를 입력하면 HOI4 전적에 집계됩니다
          </p>
        </div>
        <input
          type="checkbox"
          checked={isNaeJeon}
          onChange={(e) => onSetIsNaeJeon(e.target.checked)}
          className="h-4 w-4 shrink-0 rounded accent-amber-500"
        />
      </label>

      {rows.length > 0 ? (
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
            {isNaeJeon ? '내전 · 국가 (게스트 포함)' : 'HOI4 · 국가'}
          </label>
          <div className="space-y-2">
            {rows.map(({ id, nation, isGuest }) => {
              const streamer = streamerMap.get(id);
              if (!streamer) return null;
              return (
                <div
                  key={id}
                  className={`flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 ${
                    compact ? 'p-2' : 'p-2.5'
                  }`}
                >
                  <span className="flex min-w-0 shrink-0 items-center gap-1.5">
                    <span className="max-w-[4.5rem] truncate text-sm font-bold text-slate-700 dark:text-slate-200">
                      {streamer.name}
                    </span>
                    {isGuest ? (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        게스트
                      </span>
                    ) : null}
                  </span>
                  <input
                    type="text"
                    value={nation}
                    onChange={(e) => onUpdateParticipant(id, 'nation', e.target.value)}
                    placeholder="국가명"
                    className="min-w-[5rem] flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </>
  );
}

export function isHoi4GameSelected(gameId: string, games: Pick<Game, 'id' | 'isHoi4'>[]): boolean {
  return games.find((g) => g.id === gameId)?.isHoi4 ?? false;
}
