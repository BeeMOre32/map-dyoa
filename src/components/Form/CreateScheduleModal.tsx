// src/components/calendar/ScheduleFormModal.tsx
'use client';

import { useState, useRef } from 'react';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { X, Calendar as CalendarIcon, AlertCircle, Link as LinkIcon, WifiOff } from 'lucide-react';
import { createScheduleAction, updateScheduleAction } from '@/app/actions';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { backdropVariants, smoothModalVariants } from '@/lib/modalVariants';
import { ModalProps } from '@/types/props';
import { Streamer, Game } from '@prisma/client';
import { FlattenedSchedule } from '@/lib/schedule-formatters';
import StreamerSelector from './StreamerSelctor';

const scheduleSchema = z.object({
  title: z.string().min(1, '방송 제목을 입력해주세요.'),
  startTime: z.string().min(1, '시작 시간을 선택해주세요.'),
  streamerIds: z.array(z.string()).min(1, '참여 멤버를 최소 1명 이상 선택해주세요.'),
  liveUrl: z.string().url('올바른 URL 형식이 아닙니다.').optional().or(z.literal('')),
});

type ScheduleErrors = Partial<Record<keyof z.infer<typeof scheduleSchema> | 'submit', string>>;

type ParticipantEntry = { id: string; nation: string; result: string };


type CreateScheduleModalProps = ModalProps & {
  streamers: Streamer[];
  games: Game[];
  initialData?: FlattenedSchedule | null;
  isEdit?: boolean;
  onOptimisticCreate?: (schedule: FlattenedSchedule) => void;
};

export default function ScheduleFormModal({
  streamers,
  games,
  onClose,
  initialData,
  isEdit = false,
  onOptimisticCreate,
}: CreateScheduleModalProps) {
  const defaultTime = initialData?.startTime
    ? format(new Date(initialData.startTime), "yyyy-MM-dd'T'HH:mm")
    : '';

  const [title, setTitle] = useState(initialData?.title || '');
  const [startTime, setStartTime] = useState(defaultTime);
  const [selectedGameId, setSelectedGameId] = useState(
    initialData?.gameId || '',
  );
  const [participants, setParticipants] = useState<ParticipantEntry[]>(
    initialData?.participants?.map((p) => ({
      id: p.id,
      nation: p.nation ?? '',
      result: p.result ?? '',
    })) || [],
  );
  const [liveUrl, setLiveUrl] = useState(initialData?.liveUrl || '');
  const [isTimeTBD, setIsTimeTBD] = useState(initialData?.isGuerrilla || false);
  const [isNaeJeon, setIsNaeJeon] = useState(initialData?.isNaeJeon || false);
  const [isLiveEnded, setIsLiveEnded] = useState(initialData?.isLiveEnded || false);
  const [errors, setErrors] = useState<ScheduleErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEscapeKey(onClose);

  const sortedStreamers = [...streamers].sort((a, b) =>
    a.name.localeCompare(b.name, 'ko-KR'),
  );

  const selectedStreamers = participants.map((p) => p.id);
  const isHoi4Game =
    games.find((g) => g.id === selectedGameId)?.isHoi4 ||
    (initialData?.gameId === selectedGameId && initialData?.game?.isHoi4) ||
    false;

  const toggleStreamer = (id: string) => {
    setParticipants((prev) =>
      prev.some((p) => p.id === id)
        ? prev.filter((p) => p.id !== id)
        : [...prev, { id, nation: '', result: '' }],
    );
    if (errors.streamerIds) setErrors((e) => ({ ...e, streamerIds: undefined }));
  };

  const updateParticipant = (id: string, field: 'nation' | 'result', value: string) => {
    setParticipants((prev) => prev.map((p) => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = scheduleSchema.safeParse({ title, startTime, streamerIds: selectedStreamers, liveUrl: liveUrl || undefined });

    if (!parsed.success) {
      const fieldErrors: ScheduleErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof ScheduleErrors;
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    const resolvedStartTime = isTimeTBD
      ? new Date(startTime.split('T')[0] + 'T00:00')
      : new Date(startTime);

    const payload = {
      title,
      startTime: resolvedStartTime,
      participants: participants.map(({ id, nation, result }) => ({
        id,
        nation: nation.trim() || undefined,
        result: result || undefined,
      })),
      gameId: selectedGameId === '' ? undefined : selectedGameId,
      liveUrl: liveUrl.trim() || undefined,
      isGuerrilla: isTimeTBD,
      isNaeJeon: isHoi4Game ? isNaeJeon : false,
      isLiveEnded: isEdit ? isLiveEnded : false,
    };

    const result = isEdit
      ? await updateScheduleAction(initialData!.id, payload)
      : await createScheduleAction(payload);

    if (result.success) {
      if (!isEdit && onOptimisticCreate) {
        const selectedGame = games.find((g) => g.id === selectedGameId) ?? null;
        const flatParticipants = streamers
          .filter((s) => selectedStreamers.includes(s.id))
          .map((s) => {
            const p = participants.find((x) => x.id === s.id);
            return { ...s, nation: p?.nation.trim() || null, result: p?.result || null };
          });
        const startDate = new Date(startTime);
        onOptimisticCreate({
          id: result.data?.id ?? `optimistic-${Date.now()}`,
          title,
          content: null,
          gameId: selectedGameId || null,
          isGuerrilla: isTimeTBD,
          isNaeJeon: isHoi4Game ? isNaeJeon : false,
          isLiveEnded: false,
          liveUrl: liveUrl.trim() || null,
          startTime: startDate,
          endTime: null,
          createdAt: new Date(),
          participants: flatParticipants,
          game: selectedGame,
          formattedDate: format(startDate, 'yyyy년 MM월 dd일(EEEE)', { locale: ko }),
          formattedTime: format(startDate, 'HH:mm'),
        });
      }
      onClose();
    } else {
      setErrors({ submit: '일정 저장에 실패했습니다. 다시 시도해주세요.' });
    }
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={backdropVariants}
      className="fixed inset-0 z-70 flex items-center justify-center p-4 md:p-6 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        variants={smoothModalVariants}
        className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl dark:shadow-slate-900/50 flex flex-col max-h-[90dvh] border border-slate-100 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 md:p-8 border-b border-slate-50 dark:border-slate-700 flex justify-between items-start shrink-0 bg-slate-50/50 dark:bg-slate-700/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                {isEdit ? 'Edit Schedule' : 'New Schedule'}
              </p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {isEdit ? '일정 수정' : '새 일정 등록'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <form
          id="schedule-form"
          onSubmit={handleSubmit}
          className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                방송 제목
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((er) => ({ ...er, title: undefined }));
                }}
                placeholder="예) 문명 6 합방"
                className={`w-full p-3 bg-slate-50 dark:bg-slate-700 border rounded-xl font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all ${
                  errors.title ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'
                }`}
              />
              {errors.title && (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-500">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.title}
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
          </div>

          <div>
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
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">시간 미정</span>
              </label>
            </div>
            <input
              type={isTimeTBD ? 'date' : 'datetime-local'}
              value={isTimeTBD ? startTime.split('T')[0] : startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                if (errors.startTime) setErrors((er) => ({ ...er, startTime: undefined }));
              }}
              className={`w-full p-3 bg-slate-50 dark:bg-slate-700 border rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all scheme-light dark:scheme-dark ${
                errors.startTime ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'
              }`}
            />
            {errors.startTime && (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-500">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.startTime}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
              방송 링크 (선택)
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="url"
                value={liveUrl}
                onChange={(e) => {
                  setLiveUrl(e.target.value);
                  if (errors.liveUrl) setErrors((er) => ({ ...er, liveUrl: undefined }));
                }}
                placeholder="https://chzzk.naver.com/... 또는 YouTube URL"
                className={`w-full pl-9 pr-3 py-3 bg-slate-50 dark:bg-slate-700 border rounded-xl font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all ${
                  errors.liveUrl ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'
                }`}
              />
            </div>
            {errors.liveUrl && (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-500">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.liveUrl}
              </p>
            )}
          </div>

          {isEdit && (
            <div className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl border transition-colors ${isLiveEnded ? 'bg-orange-50 dark:bg-orange-900/15 border-orange-200 dark:border-orange-800' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'}`}>
              <WifiOff className={`w-4 h-4 mt-0.5 shrink-0 ${isLiveEnded ? 'text-orange-500 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'}`} />
              <div className="flex-1 min-w-0">
                <label className="flex items-center justify-between gap-2 cursor-pointer">
                  <div>
                    <p className={`text-sm font-bold ${isLiveEnded ? 'text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-300'}`}>
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

          <div className="relative" ref={dropdownRef}>
            <div className="border-t border-slate-100 dark:border-slate-700 pt-8 space-y-4">
              <div className="flex justify-between items-end px-2">
                <label className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                  참여 멤버 선택{' '}
                  <span className="text-indigo-500 ml-1">
                    ({selectedStreamers.length})
                  </span>
                </label>
              </div>

              {errors.streamerIds && (
                <p className="flex items-center gap-1 text-xs font-bold text-red-500 px-2">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.streamerIds}
                </p>
              )}

              <div>
                <StreamerSelector
                  streamers={sortedStreamers}
                  selectedStreamers={selectedStreamers}
                  toggleStreamer={toggleStreamer}
                />
              </div>
            </div>
          </div>

          {isHoi4Game && (
            <label className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/50 rounded-2xl cursor-pointer">
              <div>
                <p className="text-sm font-bold text-amber-700 dark:text-amber-400">내전 세션</p>
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

          {isHoi4Game && participants.length > 0 && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                HOI4 · 국가
              </label>
              <div className="space-y-2">
                {participants.map(({ id, nation }) => {
                  const streamer = streamers.find((s) => s.id === id);
                  if (!streamer) return null;
                  return (
                    <div key={id} className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200 w-16 shrink-0 truncate">
                        {streamer.name}
                      </span>
                      <input
                        type="text"
                        value={nation}
                        onChange={(e) => updateParticipant(id, 'nation', e.target.value)}
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

        <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-800 flex flex-col gap-3 border-t border-slate-100 dark:border-slate-700 shrink-0">
          {errors.submit && (
            <p className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errors.submit}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
            >
              취소
            </button>
            <button
              form="schedule-form"
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {isSubmitting ? '저장 중...' : isEdit ? '수정 완료' : '일정 등록'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
