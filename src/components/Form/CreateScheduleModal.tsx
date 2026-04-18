// src/components/calendar/ScheduleFormModal.tsx
'use client';

import { useState, useRef } from 'react';
import { X, Calendar as CalendarIcon, Check } from 'lucide-react';
import { createScheduleAction, updateScheduleAction } from '../../app/actions';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { backdropVariants, smoothModalVariants } from '@/src/lib/modalVariants';
import { Streamer, Game, ModalProps } from '@/src/d';

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
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        variants={smoothModalVariants}
        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-start shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
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
            {/* 🌟 가로 스크롤형 원형 아바타 카드 섹션 */}
            <div className="border-t border-slate-100 pt-8 space-y-4">
              <div className="flex justify-between items-end px-2">
                <label className="text-sm font-black text-slate-700 uppercase tracking-tight">
                  참여 멤버 선택{' '}
                  <span className="text-indigo-500 ml-1">
                    ({selectedStreamers.length})
                  </span>
                </label>
                <p className="text-[10px] text-slate-400 font-bold italic animate-pulse">
                  옆으로 밀어서 선택 →
                </p>
              </div>

              {/* 🌟 가로 스크롤 컨테이너 (Snap-x 적용으로 딱딱 걸리는 고급스러운 느낌) */}
              <div className="relative group">
                <div className="flex gap-4 overflow-x-auto pb-6 pt-2 px-2 no-scrollbar snap-x snap-mandatory scroll-smooth">
                  {sortedStreamers.map((streamer: any) => {
                    const isSelected = selectedStreamers.includes(streamer.id);
                    const avatarLetters = streamer.name.slice(0, 2); // 닉네임 앞 두 글자

                    return (
                      <motion.div
                        key={streamer.id}
                        className="flex-none snap-center" // 스크롤 시 중앙에 딱 걸리게
                        whileTap={{ scale: 0.95 }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleStreamer(streamer.id)}
                          className="flex flex-col items-center gap-3 transition-all duration-300"
                        >
                          {/* 상단 원형 아바타 */}
                          <div className="relative">
                            <div
                              className={`
                    w-20 h-20 rounded-full flex items-center justify-center border-4 transition-all duration-500
                    ${
                      isSelected
                        ? 'shadow-[0_0_20px_rgba(0,0,0,0.1)] scale-110'
                        : 'border-slate-50 bg-slate-50 opacity-50 grayscale-[0.5]'
                    }
                  `}
                              style={{
                                borderColor: isSelected
                                  ? streamer.colorCode
                                  : undefined,
                                backgroundColor: isSelected
                                  ? streamer.colorCode
                                  : `${streamer.colorCode}15`,
                                color: isSelected
                                  ? '#ffffff'
                                  : streamer.colorCode,
                              }}
                            >
                              <span className="text-2xl font-black tracking-tighter">
                                {avatarLetters}
                              </span>
                            </div>

                            {/* 선택 시 나타나는 체크 뱃지 */}
                            <AnimatePresence>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0, rotate: -45 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0, rotate: -45 }}
                                  className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-md border-4 border-white z-10"
                                  style={{
                                    backgroundColor: streamer.colorCode,
                                  }}
                                >
                                  <Check className="w-4 h-4 text-white stroke-[4px]" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* 하단 전체 닉네임 */}
                          <span
                            className={`text-[13px] font-black transition-all duration-300 ${
                              isSelected ? 'translate-y-1' : 'text-slate-400'
                            }`}
                            style={{
                              color: isSelected
                                ? streamer.colorCode
                                : undefined,
                            }}
                          >
                            {streamer.name}
                          </span>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>

                {/* 좌우 그라데이션 페이드 (끝부분이 잘린 느낌을 줘서 스크롤을 유도) */}
                <div className="absolute left-0 top-0 bottom-6 w-12 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
                <div className="absolute right-0 top-0 bottom-6 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
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
