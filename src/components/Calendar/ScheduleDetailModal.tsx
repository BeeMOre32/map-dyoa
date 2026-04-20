'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Edit2,
  Trash2,
  Clock,
  Users,
  Gamepad2,
  Calendar,
  ChevronLeft,
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { deleteScheduleAction } from '@/app/actions';
import CreateScheduleModal from '../Form/CreateScheduleModal';
import { backdropVariants, smoothModalVariants } from '@/lib/modalVariants';
import { GAME_COLORS } from '@/constants/gamecolor';
import Link from 'next/link';

export default function ScheduleDetailView({
  schedule,
  streamers,
  games,
}: any) {
  const router = useRouter();
  const { data: session } = useSession();

  const [isEditing, setIsEditing] = useState(false);
  const isUser = !!session;

  const handleClose = () => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      router.back();
    }
  };

  const handleDelete = async () => {
    if (!isUser) return alert('권한이 없습니다.');
    if (confirm('정말로 이 일정을 삭제하시겠습니까?')) {
      const result = await deleteScheduleAction(schedule.id);
      if (result.success) {
        router.refresh();
        router.back();
      }
    }
  };

  const gameColor =
    GAME_COLORS[schedule.game?.id] || GAME_COLORS['default'] || '#4f46e5';

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={backdropVariants}
      className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
      onClick={handleClose}
    >
      <motion.div
        variants={smoothModalVariants}
        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {isEditing ? (
          <div className="flex flex-col h-full overflow-hidden bg-white">
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center shrink-0">
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-bold transition-colors group"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                상세보기
              </button>
              <h3 className="text-lg font-black text-slate-800">일정 수정</h3>
              <div className="w-10" />
            </div>

            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
              <CreateScheduleModal
                initialData={schedule}
                isEdit={true}
                streamers={streamers}
                games={games}
                onClose={() => {
                  setIsEditing(false);
                  router.refresh();
                }}
              />
            </div>
          </div>
        ) : (
          <>
            {/* 🌟 상단 컬러 배너 (태그 제거됨) */}
            <div
              className="h-32 w-full shrink-0 relative transition-colors duration-500"
              style={{ backgroundColor: gameColor }}
            >
              <button
                onClick={() => router.back()}
                className="absolute top-6 right-6 p-2.5 bg-black/10 hover:bg-black/25 text-white rounded-full backdrop-blur-md transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 메인 컨텐츠 */}
            <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
              <div className="space-y-6">
                <h2 className="text-3xl font-black text-slate-900 leading-tight">
                  {schedule.title}
                </h2>

                {/* 🌟 날짜, 시간, 게임 태그 나란히 배치 */}
                <div className="flex flex-wrap gap-2.5">
                  {/* 게임 태그 */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-2xl font-bold text-sm border border-amber-100 shadow-sm">
                    <Gamepad2 className="w-4 h-4" />
                    <span className="uppercase tracking-tight">
                      {schedule.game?.title || '기타 방송'}
                    </span>
                  </div>

                  {/* 날짜 */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl text-slate-600 font-bold text-sm border border-slate-100">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    {format(
                      new Date(schedule.startTime),
                      'yyyy년 M월 d일 (eee)',
                      { locale: ko },
                    )}
                  </div>

                  {/* 시간 */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl text-slate-600 font-bold text-sm border border-slate-100">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    {format(new Date(schedule.startTime), 'a h:mm', {
                      locale: ko,
                    })}
                  </div>
                </div>
              </div>

              {/* 참여 멤버 섹션 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 ml-1">
                  <Users className="w-4 h-4 text-slate-300" />
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Participants
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {schedule.participants.map((p: any) => {
                    const streamer = p.streamer || p;
                    return (
                      <Link
                        href={`/streamers/detail/${streamer.id}`}
                        key={streamer.id}
                        className="px-4 py-2.5 rounded-2xl border font-bold text-sm shadow-sm transition-all hover:scale-105"
                        style={{
                          backgroundColor: `${streamer.colorCode}08`,
                          color: streamer.colorCode,
                          borderColor: `${streamer.colorCode}25`,
                        }}
                      >
                        {streamer.name}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* 하단 제어 버튼 */}
              {isUser && (
                <div className="flex gap-3 pt-4 border-t border-slate-50">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-3xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
                  >
                    <Edit2 className="w-4 h-4" />
                    내용 수정하기
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-4 bg-red-50 text-red-500 rounded-3xl border border-red-100 hover:bg-red-100 transition-all active:scale-95"
                    title="삭제"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
