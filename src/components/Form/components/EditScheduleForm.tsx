'use client';

import { AlertCircle, WifiOff } from 'lucide-react';
import StreamerSelector from '../StreamerSelctor';
import LiveUrlInput from './LiveUrlInput';
import {
  EditErrors,
  ParticipantEntry,
  Game,
  Streamer,
} from '../types';

type EditScheduleFormProps = {
  title: string;
  setTitle: (v: string) => void;
  startTime: string;
  setStartTime: (v: string) => void;
  selectedGameId: string;
  setSelectedGameId: (v: string) => void;
  participants: ParticipantEntry[];
  liveUrls: string[];
  setLiveUrls: React.Dispatch<React.SetStateAction<string[]>>;
  isTimeTBD: boolean;
  setIsTimeTBD: (v: boolean) => void;
  isNaeJeon: boolean;
  setIsNaeJeon: (v: boolean) => void;
  isLiveEnded: boolean;
  setIsLiveEnded: (v: boolean) => void;
  isEdit: boolean;
  isHoi4Game: boolean;
  editErrors: EditErrors;
  editMetaLoading: boolean;
  editAutoFilled: string[];
  setEditAutoFilled: React.Dispatch<React.SetStateAction<string[]>>;
  sortedStreamers: Streamer[];
  games: Game[];
  onToggleStreamer: (id: string) => void;
  onToggleGuest: (id: string) => void;
  onClearError: (field: keyof EditErrors) => void;
  onUpdateParticipant: (id: string, field: 'nation' | 'result', value: string) => void;
  onLiveUrlBlur: (urlIndex: number) => Promise<void>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
};

export default function EditScheduleForm({
  title,
  setTitle,
  startTime,
  setStartTime,
  selectedGameId,
  setSelectedGameId,
  participants,
  liveUrls,
  setLiveUrls,
  isTimeTBD,
  setIsTimeTBD,
  isNaeJeon,
  setIsNaeJeon,
  isLiveEnded,
  setIsLiveEnded,
  isEdit,
  isHoi4Game,
  editErrors,
  editMetaLoading,
  editAutoFilled,
  setEditAutoFilled,
  sortedStreamers,
  games,
  onToggleStreamer,
  onToggleGuest,
  onClearError,
  onUpdateParticipant,
  onLiveUrlBlur,
  onSubmit,
}: EditScheduleFormProps) {
  const selectedStreamers = participants.map((p) => p.id);
  const guestStreamers = participants.filter((p) => p.isGuest).map((p) => p.id);
  const memberCount = participants.length - guestStreamers.length;
  const nationEntryParticipants = isNaeJeon
    ? participants
    : participants.filter((p) => !p.isGuest);

  return (
    <form
      id="schedule-form"
      onSubmit={onSubmit}
      noValidate
      className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto"
    >
      <LiveUrlInput
        liveUrls={liveUrls}
        setLiveUrls={setLiveUrls}
        metaLoading={editMetaLoading}
        autoFilled={editAutoFilled}
        setAutoFilled={setEditAutoFilled}
        onUrlBlur={onLiveUrlBlur}
      />

      <div data-zod-field="title">
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
          방송 제목
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (editErrors.title) onClearError('title');
          }}
          placeholder="예) 문명 6 합방"
          className={`w-full px-4 py-4 bg-slate-50 dark:bg-slate-700 border rounded-xl text-base font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all ${editErrors.title ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
        />
        {editErrors.title && (
          <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-500">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {editErrors.title}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
          플레이 게임 (선택)
        </label>
        <select
          value={selectedGameId}
          onChange={(e) => setSelectedGameId(e.target.value)}
          className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500/50 outline-none text-slate-700 dark:text-slate-200 transition-all"
        >
          <option value="">선택 안 함</option>
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.title}
            </option>
          ))}
        </select>
      </div>

      <div data-zod-field="startTime">
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
            시작 시간
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isTimeTBD}
              onChange={(e) => setIsTimeTBD(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-indigo-600"
            />
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
              시간 미정
            </span>
          </label>
        </div>
        <input
          type={isTimeTBD ? 'date' : 'datetime-local'}
          value={isTimeTBD ? startTime.split('T')[0] : startTime}
          onChange={(e) => {
            setStartTime(e.target.value);
            if (editErrors.startTime) onClearError('startTime');
          }}
          className={`w-full p-3 bg-slate-50 dark:bg-slate-700 border rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all scheme-light dark:scheme-dark ${editErrors.startTime ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
        />
        {editErrors.startTime && (
          <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-500">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {editErrors.startTime}
          </p>
        )}
      </div>

      {isEdit && (
        <div
          className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl border transition-colors ${isLiveEnded ? 'bg-orange-50 dark:bg-orange-900/15 border-orange-200 dark:border-orange-800' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'}`}
        >
          <WifiOff
            className={`w-4 h-4 mt-0.5 shrink-0 ${isLiveEnded ? 'text-orange-500 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'}`}
          />
          <div className="flex-1 min-w-0">
            <label className="flex items-center justify-between gap-2 cursor-pointer">
              <div>
                <p
                  className={`text-sm font-bold ${isLiveEnded ? 'text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  라이브 강제 종료
                </p>
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                  체크 시 자동 감지를 무시하고 라이브 뱃지를 숨깁니다
                </p>
              </div>
              <input
                type="checkbox"
                checked={isLiveEnded}
                onChange={(e) => {
                  if (e.target.checked) {
                    const ok = confirm(
                      '⚠️ 라이브 강제 종료\n\n체크 시 자동 감지를 무시하고 라이브 뱃지를 강제로 숨깁니다.\n방송이 실제로 종료됐을 때만 사용해주세요.\n\n계속하시겠습니까?',
                    );
                    if (!ok) return;
                  }
                  setIsLiveEnded(e.target.checked);
                }}
                className="w-4 h-4 rounded accent-orange-500 shrink-0"
              />
            </label>
          </div>
        </div>
      )}

      <div
        className="border-t border-slate-100 dark:border-slate-700 pt-8 space-y-4"
        data-zod-field="streamerIds"
      >
        <div className="flex justify-between items-end px-2">
          <label className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">
            참여자 선택{' '}
            <span className="text-indigo-500 ml-1">
              (멤버 {memberCount} · 게스트 {guestStreamers.length})
            </span>
          </label>
        </div>
        {editErrors.streamerIds && (
          <p className="flex items-center gap-1 text-xs font-bold text-red-500 px-2">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {editErrors.streamerIds}
          </p>
        )}
        <StreamerSelector
          streamers={sortedStreamers}
          selectedStreamers={selectedStreamers}
          guestStreamers={guestStreamers}
          toggleStreamer={onToggleStreamer}
          toggleGuest={onToggleGuest}
        />
      </div>

      {isHoi4Game && (
        <label className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/50 rounded-2xl cursor-pointer">
          <div>
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
              내전 세션
            </p>
            <p className="text-xs font-medium text-amber-500 dark:text-amber-600 mt-0.5">
              체크 시 HOI4 참전 기록 페이지에 집계됩니다
            </p>
          </div>
          <input
            type="checkbox"
            checked={isNaeJeon}
            onChange={(e) => setIsNaeJeon(e.target.checked)}
            className="w-4 h-4 rounded accent-amber-500 shrink-0"
          />
        </label>
      )}

      {isHoi4Game && nationEntryParticipants.length > 0 && (
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
            {isNaeJeon ? '내전 · 플레이 국가 (게스트 포함)' : 'HOI4 · 국가'}
          </label>
          <div className="space-y-2">
            {nationEntryParticipants.map(({ id, nation, isGuest }) => {
              const streamer = sortedStreamers.find((s) => s.id === id);
              if (!streamer) return null;
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                >
                  <span className="flex min-w-0 shrink-0 items-center gap-1.5">
                    <span className="max-w-[4.5rem] truncate text-sm font-bold text-slate-700 dark:text-slate-200">
                      {streamer.name}
                    </span>
                    {isGuest && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        게스트
                      </span>
                    )}
                  </span>
                  <input
                    type="text"
                    value={nation}
                    onChange={(e) => onUpdateParticipant(id, 'nation', e.target.value)}
                    placeholder="국가명"
                    className="flex-1 min-w-0 px-2.5 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </form>
  );
}
