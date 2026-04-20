// src/components/calendar/ScheduleFormModal.tsx
'use client';

import { useState, useRef } from 'react';
import { X, Calendar as CalendarIcon, Check } from 'lucide-react';
import { createScheduleAction, updateScheduleAction } from '@/app/actions';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { backdropVariants, smoothModalVariants } from '@/lib/modalVariants';
import { Streamer, Game, ModalProps } from '@/d';
import StreamerSelector from './StreamerSelctor';

type CreateScheduleModalProps = ModalProps & {
  streamers: Streamer[];
  games: Game[];
  initialData?: any;
  isEdit?: boolean;
};

export default function ScheduleFormModal({
  streamers,
  games,
  onClose,
  initialData,
  isEdit = false,
}: CreateScheduleModalProps) {
  const defaultTime = initialData?.startTime
    ? format(new Date(initialData.startTime), "yyyy-MM-dd'T'HH:mm")
    : '';

  console.log('Initial Data:', initialData);

  const [title, setTitle] = useState(initialData?.title || '');
  const [startTime, setStartTime] = useState(defaultTime);
  const [selectedGameId, setSelectedGameId] = useState(
    initialData?.gameId || '',
  );
  const [selectedStreamers, setSelectedStreamers] = useState<string[]>(
    initialData?.participants?.map((p: any) => p.id) || [],
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const sortedStreamers = [...streamers].sort((a, b) =>
    a.name.localeCompare(b.name, 'ko-KR'),
  );

  const toggleStreamer = (id: string) => {
    setSelectedStreamers((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime || selectedStreamers.length === 0) {
      return alert(
        '제목, 시간, 그리고 참여 멤버를 최소 1명 이상 선택해주세요!',
      );
    }

    setIsSubmitting(true);
    const payload = {
      title,
      startTime: new Date(startTime),
      streamerIds: selectedStreamers,
      gameId: selectedGameId === '' ? undefined : selectedGameId,
    };

    const result = isEdit
      ? await updateScheduleAction(initialData!.id, payload)
      : await createScheduleAction(payload);

    if (result.success) onClose();
    else alert('일정 저장에 실패했습니다.');
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
        className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl dark:shadow-slate-900/50 flex flex-col max-h-[90vh] border border-slate-100 dark:border-slate-700"
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
              <h3 className="text-2xl font-black text-slate-800">
                {isEdit ? '일정 수정' : '새 일정 등록'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
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
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">
                방송 제목
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예) 문명 6 합방"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">
                플레이 게임 (선택)
              </label>
              <select
                value={selectedGameId}
                onChange={(e) => setSelectedGameId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500/50 outline-none text-slate-700 transition-all"
              >
                <option value="">선택 안 함</option>
                {games.map((game: any) => (
                  <option key={game.id} value={game.id}>
                    {game.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">
              시작 시간
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
            />
          </div>

          <div className="relative" ref={dropdownRef}>
            <div className="border-t border-slate-100 pt-8 space-y-4">
              <div className="flex justify-between items-end px-2">
                <label className="text-sm font-black text-slate-700 uppercase tracking-tight">
                  참여 멤버 선택{' '}
                  <span className="text-indigo-500 ml-1">
                    ({selectedStreamers.length})
                  </span>
                </label>
              </div>

              <div>
                <StreamerSelector
                  streamers={sortedStreamers}
                  selectedStreamers={selectedStreamers}
                  toggleStreamer={toggleStreamer}
                />
              </div>
            </div>
          </div>
        </form>

        <div className="p-6 md:p-8 bg-slate-50 flex gap-3 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 bg-white text-slate-600 rounded-2xl font-bold border border-slate-200 hover:bg-slate-50 transition-colors"
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
      </motion.div>
    </motion.div>
  );
}
