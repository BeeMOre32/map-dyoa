'use client';

import { useState } from 'react';
import { useEscapeKey } from '@/hooks/useEscapeKey';
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
  ExternalLink,
  Play,
  Tv,
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
import type { Streamer, Game } from '@prisma/client';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';

interface ScheduleDetailViewProps {
  schedule: FlattenedSchedule;
  streamers: Streamer[];
  games: Game[];
}

export default function ScheduleDetailView({
  schedule,
  streamers,
  games,
}: ScheduleDetailViewProps) {
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

  useEscapeKey(handleClose);

  const handleDelete = async () => {
    if (confirm('정말로 이 일정을 삭제하시겠습니까?')) {
      const result = await deleteScheduleAction(schedule.id);
      if (result.success) {
        router.refresh();
        router.back();
      }
    }
  };

  const gameColor =
    (schedule.game?.id ? GAME_COLORS[schedule.game.id] : undefined) ??
    GAME_COLORS['default'] ??
    '#4f46e5';

  const getLinkMeta = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return { label: 'YouTube 다시보기', icon: Play, className: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30' };
    }
    if (url.includes('chzzk.naver.com')) {
      return { label: 'CHZZK 라이브', icon: Tv, className: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30' };
    }
    return { label: '방송 링크', icon: ExternalLink, className: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30' };
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={backdropVariants}
      className="fixed inset-0 z-70 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md"
      onClick={handleClose}
    >
      <motion.div
        variants={smoothModalVariants}
        className="bg-white dark:bg-slate-800 w-full sm:max-w-lg rounded-t-4xl sm:rounded-[2.5rem] shadow-2xl dark:shadow-slate-900/50 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] border border-slate-100 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {isEditing ? (
          <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-slate-800">
            <div className="px-5 py-4 sm:px-8 sm:py-6 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center shrink-0 bg-slate-50/50 dark:bg-slate-700/30">
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold transition-colors group"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                상세보기
              </button>
              <h3 className="text-lg font-black text-slate-800 dark:text-white">
                일정 수정
              </h3>
              <div className="w-10" />
            </div>

            <div className="p-5 sm:p-8 overflow-y-auto flex-1 custom-scrollbar">
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
              className="h-16 w-full shrink-0 relative transition-colors duration-500"
              style={{ backgroundColor: gameColor }}
            >
              <button
                onClick={() => router.back()}
                className="absolute top-1/2 -translate-y-1/2 right-4 p-2 sm:p-2.5 bg-black/10 hover:bg-black/25 text-white rounded-full backdrop-blur-md transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 메인 컨텐츠 */}
            <div className="p-5 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto flex-1 custom-scrollbar bg-white dark:bg-slate-800">
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                  {schedule.title}
                </h2>

                {/* 🌟 날짜, 시간, 게임 태그 나란히 배치 */}
                <div className="flex flex-wrap gap-2.5">
                  {/* 게임 태그 */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-2xl font-bold text-sm border border-amber-100 dark:border-amber-800 shadow-sm">
                    <Gamepad2 className="w-4 h-4" />
                    <span className="uppercase tracking-tight">
                      {schedule.game?.title || '기타 방송'}
                    </span>
                  </div>

                  {/* 날짜 */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 font-bold text-sm border border-slate-100 dark:border-slate-600">
                    <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    {format(
                      new Date(schedule.startTime),
                      'yyyy년 M월 d일 (eee)',
                      { locale: ko },
                    )}
                  </div>

                  {/* 시간 */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 font-bold text-sm border border-slate-100 dark:border-slate-600">
                    <Clock className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    {format(new Date(schedule.startTime), 'a h:mm', {
                      locale: ko,
                    })}
                  </div>
                </div>
              </div>

              {/* 참여 멤버 섹션 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 ml-1">
                  <Users className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                  <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                    Participants
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {schedule.participants.map((p) => (
                    <Link
                      href={`/streamers/detail/${p.id}`}
                      key={p.id}
                      className="px-4 py-2.5 rounded-2xl border font-bold text-sm shadow-sm transition-all hover:scale-105"
                      style={{
                        backgroundColor: `${p.colorCode}08`,
                        color: p.colorCode,
                        borderColor: `${p.colorCode}25`,
                      }}
                    >
                      {p.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* 방송 링크 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 ml-1">
                  <ExternalLink className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                  <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                    VOD / Live
                  </span>
                </div>
                {schedule.liveUrl ? (() => {
                  const { label, icon: Icon, className } = getLinkMeta(schedule.liveUrl);
                  return (
                    <a
                      href={schedule.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl border font-bold text-sm transition-all active:scale-95 ${className}`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {label}
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  );
                })() : (
                  <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 text-sm font-bold">
                    <ExternalLink className="w-4 h-4 shrink-0 opacity-50" />
                    아직 등록된 링크가 없어요
                  </div>
                )}
              </div>

              {/* 하단 제어 버튼 */}
              {isUser && (
                <div className="flex gap-3 pt-4 border-t border-slate-50 dark:border-slate-700">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-3xl font-black hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-xl shadow-slate-200 dark:shadow-indigo-900/30 active:scale-95"
                  >
                    <Edit2 className="w-4 h-4" />
                    내용 수정하기
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-3.5 sm:p-4 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-3xl border border-red-100 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all active:scale-95"
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
