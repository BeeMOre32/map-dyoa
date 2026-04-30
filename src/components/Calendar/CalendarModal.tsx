'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { motion } from 'framer-motion';
import {
  X,
  Trash2,
  Edit2,
  Gamepad2,
  Clock,
  Users,
  ArrowRight,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { deleteScheduleAction } from '@/app/actions';
import CreateScheduleModal from '../Form/CreateScheduleModal';
import { backdropVariants, smoothModalVariants } from '@/lib/modalVariants';
import { CalendarModalProps } from '@/types/props';
import { useScheduleModal } from '@/hooks/useScheduleModal';
import { getGameColor } from '@/constants/gamecolor';
import { getStreamerColor } from '@/constants/streamercolor';
import { useTheme } from 'next-themes';
import { FlattenedSchedule } from '@/lib/schedule-formatters';
import { Streamer } from '@prisma/client';

export default function ScheduleModal({
  selectedDate,
  schedules,
  onClose,
  streamers,
  games,
}: CalendarModalProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { editingSchedule, toggleEditMode, exitEditMode } = useScheduleModal();
  const { resolvedTheme } = useTheme();
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const isAdmin = session;

  const handleClose = () => {
    if (editingSchedule) {
      exitEditMode();
      return;
    }

    const isDeepLinked =
      window.location.pathname.includes('/day/') ||
      window.location.pathname.includes('/schedule/');

    if (isDeepLinked) {
      router.back();
    } else if (onClose) {
      onClose();
    } else {
      router.push('/calendar');
    }
  };

  useEscapeKey(handleClose);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAdmin) {
      setPermissionError('로그인이 필요합니다.');
      return;
    }

    if (confirm('정말로 이 일정을 삭제하시겠습니까?')) {
      const result = await deleteScheduleAction(id);
      if (result.success) {
        router.refresh();
        onClose?.();
      }
    }
  };

  const handleEditTrigger = (e: React.MouseEvent, schedule: FlattenedSchedule) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAdmin) {
      setPermissionError('로그인이 필요합니다.');
      return;
    }

    toggleEditMode(schedule);
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={backdropVariants}
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <motion.div
        variants={smoothModalVariants}
        className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl dark:shadow-black/60 overflow-hidden flex flex-col max-h-[90dvh] border border-slate-100 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {editingSchedule ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* 수정 모드 헤더 */}
            <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
              <button
                onClick={() => exitEditMode()}
                className="flex items-center gap-2 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                목록으로
              </button>
              <h3 className="text-xl font-black text-slate-800 dark:text-white">일정 수정</h3>
              <div className="w-10" /> {/* 밸런스용 빈 공간 */}
            </div>

            <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
              <CreateScheduleModal
                initialData={editingSchedule} // 🌟 기존 데이터 전달
                isEdit={true} // 🌟 수정 모드임을 전달
                onClose={() => {
                  exitEditMode();
                  router.refresh();
                }}
                streamers={streamers}
                games={games}
              />
            </div>
          </div>
        ) : (
          <>
            {/* 헤더 부분 */}
            <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900 shrink-0">
              <div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                  {format(selectedDate, 'M월 d일 (eeee)', { locale: ko })}
                </h3>
                <p className="text-slate-400 dark:text-slate-500 font-bold text-sm mt-1 uppercase tracking-wider">
                  Daily Schedule
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-400 dark:text-slate-500" />
              </button>
            </div>

            {/* 일정 리스트 영역 */}
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar bg-slate-50/30 dark:bg-slate-950/40">
              {schedules.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400 font-bold">
                    등록된 일정이 없습니다.
                  </p>
                </div>
              ) : (
                schedules.map((schedule) => (
                  <Link
                    key={schedule.id}
                    href={`/calendar/schedule/${schedule.id}`}
                    scroll={false}
                    className="group block"
                  >
                    <div className="relative p-6 rounded-4xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm dark:shadow-black/30 group-hover:shadow-md group-hover:border-indigo-100 dark:group-hover:border-indigo-700 transition-all duration-300">
                      <div className="flex justify-between items-start mb-4 gap-4">
                        {schedule.game ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full border border-amber-100 dark:border-amber-800 shadow-sm shrink-0 max-w-[70%] ">
                            <Gamepad2 className="w-4 h-4 shrink-0" />
                            <span
                              className="text-xs font-black uppercase tracking-tight truncate"
                              style={{
                                color:
                                  getGameColor(schedule.game.id, resolvedTheme === 'dark') ?? undefined,
                              }}
                            >
                              {schedule.game.title}
                            </span>
                          </div>
                        ) : (
                          <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-400 rounded-full border border-slate-200 dark:border-slate-600 shrink-0">
                            <span className="text-xs font-bold">기타 방송</span>
                          </div>
                        )}

                        <div className="flex gap-1 shrink-0">
                          {isAdmin && (
                            <>
                              <button
                                onClick={(e) => handleEditTrigger(e, schedule)}
                                className="p-2 text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors bg-slate-100 dark:bg-slate-700 rounded-full"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleDelete(e, schedule.id)}
                                className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors bg-slate-100 dark:bg-slate-700 rounded-full"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xl font-black text-slate-800 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {schedule.title}
                          </h4>
                          <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                        </div>

                        <div className="flex flex-wrap gap-3 items-center text-sm">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
                            <Clock className="w-4 h-4 text-indigo-400" />
                            {schedule.isGuerrilla
                              ? '시간 미정'
                              : format(new Date(schedule.startTime), 'a h:mm', { locale: ko })}
                          </div>
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
                            <Users className="w-4 h-4 text-emerald-400" />
                            {schedule.participants.length}명 참여
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                          {schedule.participants.map((participant: Streamer) => (
                            <span
                              key={participant.id}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-sm"
                              style={((c) => ({
                                backgroundColor: `${c}15`,
                                color: c,
                                borderColor: `${c}30`,
                              }))(getStreamerColor(participant.id, resolvedTheme === 'dark') ?? participant.colorCode)}
                            >
                              {participant.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-900 shrink-0 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3">
              {permissionError && (
                <p className="w-full flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {permissionError}
                </p>
              )}
              <button
                onClick={handleClose}
                className="w-full md:w-auto px-12 py-3.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                닫기
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
