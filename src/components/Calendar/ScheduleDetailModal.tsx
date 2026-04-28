'use client';

import { useState } from 'react';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Edit2,
  Trash2,
  Clock,
  Users,
  Gamepad2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Play,
  Tv,
  Clapperboard,
  ArrowUpRight,
  Plus,
  LayoutGrid,
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { deleteScheduleAction } from '@/app/actions';
import CreateScheduleModal from '../Form/CreateScheduleModal';
import { backdropVariants, smoothModalVariants } from '@/lib/modalVariants';
import { getGameColor } from '@/constants/gamecolor';
import { getStreamerColor } from '@/constants/streamercolor';
import Link from 'next/link';
import type { Streamer, Game } from '@prisma/client';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';

type ClipForSchedule = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  clipDate: Date | string | null;
  participants: { streamer: { id: string; name: string; colorCode: string } }[];
};

function ClipSidePanel({
  clips,
  selectedClip,
  onSelect,
  isDark,
  onClose,
}: {
  clips: ClipForSchedule[];
  selectedClip: ClipForSchedule | null;
  onSelect: (clip: ClipForSchedule | null) => void;
  isDark: boolean;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2.5 shrink-0 bg-slate-50/50 dark:bg-slate-700/30">
        {selectedClip ? (
          <button
            onClick={() => onSelect(null)}
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-slate-400 dark:text-slate-500"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        ) : (
          <Clapperboard className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
        )}
        <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex-1">
          {selectedClip ? 'Clip' : clips.length > 0 ? `Clips · ${clips.length}` : 'Clips'}
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-slate-400 dark:text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 콘텐츠: 목록 ↔ 상세 전환 */}
      <AnimatePresence mode="wait">
        {selectedClip ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex-1 min-h-0 flex flex-col"
          >
            <div className="flex-1 min-h-0 p-5 space-y-4 overflow-y-auto overscroll-y-contain custom-scrollbar">
              <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug">
                {selectedClip.title}
              </h3>
              {selectedClip.participants.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedClip.participants.map((p) => (
                    <span
                      key={p.streamer.id}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={((c) => ({ color: c, backgroundColor: `${c}18` }))(
                        getStreamerColor(p.streamer.id, isDark) ?? p.streamer.colorCode
                      )}
                    >
                      {p.streamer.name}
                    </span>
                  ))}
                </div>
              )}
              {selectedClip.clipDate && (
                <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-bold">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(selectedClip.clipDate), 'yyyy년 M월 d일', { locale: ko })}
                </div>
              )}
              {selectedClip.description && (
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-700/50 rounded-2xl px-4 py-3.5">
                  {selectedClip.description}
                </p>
              )}
            </div>
            <div className="p-5 border-t border-slate-100 dark:border-slate-700 shrink-0">
              <a
                href={selectedClip.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm transition-all active:scale-95 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30"
              >
                클립 보러가기
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain custom-scrollbar p-3 space-y-1.5"
          >
            {clips.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-5 py-8 px-4 text-center">
                <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-700/50">
                  <Clapperboard className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-black text-slate-500 dark:text-slate-400">
                    아직 등록된 클립이 없어요
                  </p>
                  <p className="text-xs font-bold text-slate-300 dark:text-slate-600">
                    많은 이용 부탁드립니다 :)
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <a
                    href="/clips"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-black transition-all hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                  >
                    클립 모음 보러가기
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="/clips"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    클립 직접 추가하기
                  </a>
                </div>
              </div>
            ) : clips.map((clip) => (
              <button
                key={clip.id}
                onClick={() => onSelect(clip)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-700 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 text-left transition-all group"
              >
                <Clapperboard className="w-4 h-4 shrink-0 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {clip.title}
                  </p>
                  {clip.participants.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {clip.participants.map((p) => (
                        <span
                          key={p.streamer.id}
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={((c) => ({ color: c, backgroundColor: `${c}18` }))(
                            getStreamerColor(p.streamer.id, isDark) ?? p.streamer.colorCode
                          )}
                        >
                          {p.streamer.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 shrink-0 text-slate-200 dark:text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ScheduleDetailViewProps {
  schedule: FlattenedSchedule;
  streamers: Streamer[];
  games: Game[];
  clips?: ClipForSchedule[];
}

export default function ScheduleDetailView({
  schedule,
  streamers,
  games,
  clips = [],
}: ScheduleDetailViewProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const [isEditing, setIsEditing] = useState(false);
  const [selectedClip, setSelectedClip] = useState<ClipForSchedule | null>(null);
  const [showClipSheet, setShowClipSheet] = useState(false);
  const isUser = !!session;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const handleClose = () => {
    if (selectedClip) {
      setSelectedClip(null);
    } else if (showClipSheet) {
      setShowClipSheet(false);
    } else if (isEditing) {
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

  const gameColor = schedule.game?.id
    ? (getGameColor(schedule.game.id, isDark) ?? '#4f46e5')
    : '#4f46e5';

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
      {/* 메인 모달 + 클립 패널 */}
      <div className="flex sm:flex-row sm:items-start sm:gap-3 w-full sm:w-auto">

        {/* 메인 스케줄 모달 */}
        <motion.div
          variants={smoothModalVariants}
          className="relative bg-white dark:bg-slate-800 w-full sm:max-w-lg rounded-t-4xl sm:rounded-[2.5rem] shadow-2xl dark:shadow-slate-900/50 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] border border-slate-100 dark:border-slate-700"
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

              <div className="p-5 sm:p-8 overflow-y-auto flex-1 min-h-0 overscroll-y-contain custom-scrollbar">
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
              {/* 상단 컬러 배너 */}
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
              <div className="p-5 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto flex-1 min-h-0 overscroll-y-contain custom-scrollbar bg-white dark:bg-slate-800">
                <div className="space-y-4 sm:space-y-6">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                    {schedule.title}
                  </h2>

                  <div className="flex flex-wrap gap-2.5">
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-2xl font-bold text-sm border border-amber-100 dark:border-amber-800 shadow-sm">
                      <Gamepad2 className="w-4 h-4" />
                      <span className="uppercase tracking-tight">
                        {schedule.game?.title || '기타 방송'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 font-bold text-sm border border-slate-100 dark:border-slate-600">
                      <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                      {format(new Date(schedule.startTime), 'yyyy년 M월 d일 (eee)', { locale: ko })}
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 font-bold text-sm border border-slate-100 dark:border-slate-600">
                      <Clock className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                      {schedule.isGuerrilla
                        ? '시간 미정'
                        : format(new Date(schedule.startTime), 'a h:mm', { locale: ko })}
                    </div>
                  </div>
                </div>

                {/* 참여 멤버 */}
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
                        style={((c) => ({
                          backgroundColor: `${c}08`,
                          color: c,
                          borderColor: `${c}25`,
                        }))(getStreamerColor(p.id, isDark) ?? p.colorCode)}
                      >
                        {p.name}
                      </Link>
                    ))}
                  </div>

                  {/* 멀티뷰 버튼 */}
                  {schedule.participants.length >= 2 && (
                    <Link
                      href={`/calendar/schedule/${schedule.id}/multiview`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/60 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
                    >
                      <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl shrink-0">
                        <LayoutGrid className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">멀티뷰로 함께 보기</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                          {schedule.participants.length}명의 방송을 한 화면에서
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-indigo-400 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                  )}
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

              {/* 모바일: 클립 버튼 (하단 고정) */}
              <div className="sm:hidden shrink-0 px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                <button
                  onClick={() => setShowClipSheet(true)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-700 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 transition-all"
                >
                  <Clapperboard className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300 flex-1 text-left">
                    클립 보기
                  </span>
                  {clips.length > 0 && (
                    <span className="text-xs font-black text-white bg-indigo-500 rounded-full px-2 py-0.5">
                      {clips.length}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                </button>
              </div>
            </>
          )}
        </motion.div>

        {/* 데스크탑: 클립 패널 (항상 표시) */}
        <AnimatePresence>
          {!isEditing && (
            <motion.div
              key="clip-panel"
              className="hidden sm:flex flex-col bg-white dark:bg-slate-800 w-72 rounded-[2.5rem] shadow-2xl dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 overflow-hidden max-h-[90vh]"
              initial={{ opacity: 0, x: 16, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 16, scale: 0.97 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ClipSidePanel
                clips={clips}
                selectedClip={selectedClip}
                onSelect={setSelectedClip}
                isDark={isDark}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* 모바일: 클립 바텀시트 */}
      <AnimatePresence>
        {showClipSheet && (
          <>
            <motion.div
              className="sm:hidden fixed inset-0 z-80 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setSelectedClip(null); setShowClipSheet(false); }}
            />
            <motion.div
              className="sm:hidden fixed inset-x-0 bottom-0 z-85 bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl border-t border-slate-100 dark:border-slate-700 flex flex-col max-h-[75vh]"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
              </div>
              <ClipSidePanel
                clips={clips}
                selectedClip={selectedClip}
                onSelect={setSelectedClip}
                isDark={isDark}
                onClose={() => { setSelectedClip(null); setShowClipSheet(false); }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
