'use client';

import { useSession } from 'next-auth/react';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { deleteScheduleAction } from '../../app/actions';
import CreateScheduleModal from '../Form/CreateScheduleModal';
import { backdropVariants, smoothModalVariants } from '@/src/lib/modalVariants';
import { CalendarModalProps } from '@/src/d';
import { useScheduleModal } from '@/src/hooks/useScheduleModal';
import { GAME_COLORS } from '@/src/constants/gamecolor';

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

  console.log('Client Received Schedules:', schedules);

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

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAdmin) return alert('권한이 없습니다.');

    if (confirm('정말로 이 일정을 삭제하시겠습니까?')) {
      const result = await deleteScheduleAction(id);
      if (result.success) {
        router.refresh();
        onClose?.();
      }
    }
  };

  const handleEditTrigger = (e: React.MouseEvent, schedule: any) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAdmin) return alert('권한이 없습니다.');

    toggleEditMode(schedule);
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={backdropVariants}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={handleClose}
    >
      <motion.div
        variants={smoothModalVariants}
        className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {editingSchedule ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* 수정 모드 헤더 */}
            <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-center bg-white shrink-0">
              <button
                onClick={() => exitEditMode()}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-bold transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                목록으로
              </button>
              <h3 className="text-xl font-black text-slate-800">일정 수정</h3>
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
            <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div>
                <h3 className="text-2xl font-black text-slate-800">
                  {format(selectedDate, 'M월 d일 (eeee)', { locale: ko })}
                </h3>
                <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-wider">
                  Daily Schedule
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* 일정 리스트 영역 */}
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar bg-slate-50/30">
              {schedules.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400 font-bold">
                    등록된 일정이 없습니다.
                  </p>
                </div>
              ) : (
                schedules.map((schedule: any) => (
                  <Link
                    key={schedule.id}
                    href={`/calendar/schedule/${schedule.id}`}
                    scroll={false}
                    className="group block"
                  >
                    <div className="relative p-6 rounded-[2rem] border border-slate-100 bg-white shadow-sm group-hover:shadow-md group-hover:border-indigo-100 transition-all duration-300">
                      <div className="flex justify-between items-start mb-4 gap-4">
                        {schedule.game ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-full border border-amber-100 shadow-sm shrink-0 max-w-[70%] ">
                            <Gamepad2 className="w-4 h-4 shrink-0" />
                            <span
                              className="text-xs font-black uppercase tracking-tight truncate"
                              style={{
                                color:
                                  GAME_COLORS[schedule.game.id] ||
                                  GAME_COLORS['default'],
                              }}
                            >
                              {schedule.game.title}
                            </span>
                          </div>
                        ) : (
                          <div className="px-3 py-1.5 bg-slate-50 text-slate-400 rounded-full border border-slate-100 shrink-0">
                            <span className="text-xs font-bold">기타 방송</span>
                          </div>
                        )}

                        <div className="flex gap-1 shrink-0">
                          {isAdmin && (
                            <>
                              <button
                                onClick={(e) => handleEditTrigger(e, schedule)}
                                className="p-2 text-slate-300 hover:text-blue-500 transition-colors bg-slate-50 rounded-full"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleDelete(e, schedule.id)}
                                className="p-2 text-slate-300 hover:text-red-500 transition-colors bg-slate-50 rounded-full"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xl font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                            {schedule.title}
                          </h4>
                          <ArrowRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                        </div>

                        <div className="flex flex-wrap gap-3 items-center text-sm">
                          <div className="flex items-center gap-2 text-slate-600 font-bold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                            <Clock className="w-4 h-4 text-indigo-400" />
                            {format(new Date(schedule.startTime), 'a h:mm', {
                              locale: ko,
                            })}
                          </div>
                          <div className="flex items-center gap-2 text-slate-600 font-bold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                            <Users className="w-4 h-4 text-emerald-400" />
                            {schedule.participants.length}명 참여
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                          {schedule.participants.map((participant: any) => {
                            const target = participant.streamer || participant;
                            return (
                              <span
                                key={target.id}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-sm"
                                style={{
                                  backgroundColor: `${target.colorCode}15`,
                                  color: target.colorCode,
                                  borderColor: `${target.colorCode}30`,
                                }}
                              >
                                {target.name}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            <div className="p-6 md:p-8 bg-slate-50 text-center shrink-0 border-t border-slate-100">
              <button
                onClick={handleClose}
                className="w-full md:w-auto px-12 py-3.5 bg-white text-slate-600 font-bold rounded-2xl border border-slate-200 hover:bg-slate-100 transition-colors shadow-sm"
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
