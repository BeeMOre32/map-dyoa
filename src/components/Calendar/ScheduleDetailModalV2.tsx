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
  ExternalLink,
  Play,
  Tv,
  ArrowUpRight,
  LayoutGrid,
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useGoBack } from '@/hooks/useGoBack';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import {
  deleteScheduleRequest,
  navigateToCalendarAfterDelete,
} from '@/lib/schedule-delete-client';
import CreateScheduleModal from '../Form/CreateScheduleModal';
import { useToast } from '@/components/Common/Toaster';
import ConfirmModal from '@/components/Common/ConfirmModal';
import {
  backdropVariants,
  bottomSheetVariants,
  companionPanelVariants,
  sheetBackdropVariants,
  smoothModalVariants,
} from '@/lib/modalVariants';
import { getGameColor } from '@/constants/gamecolor';
import { getStreamerColor } from '@/constants/streamercolor';
import { getStreamerImagePath } from '@/lib/utils';
import Link from 'next/link';
import type { Streamer, Game } from '@prisma/client';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';
import {
  SidePanel,
  type ClipForSchedule,
  type SideTab,
} from './ScheduleSidePanel';
import {
  filterScheduleLiveUrls,
  hasScheduleBroadcastStarted,
} from '@/lib/schedule-live';
import { useMinuteClock } from '@/hooks/useMinuteClock';
import ScheduleShareButton from '@/components/Calendar/ScheduleShareButton';
interface Props {
  schedule: FlattenedSchedule;
  streamers: Streamer[];
  games: Game[];
  clips?: ClipForSchedule[];
  onScheduleUpdated?: (schedule: FlattenedSchedule) => void;
}

function getLinkMeta(url: string) {
  if (url.includes('youtube.com') || url.includes('youtu.be'))
    return {
      label: 'YouTube 다시보기',
      icon: Play,
      className:
        'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30',
    };
  if (url.includes('chzzk.naver.com'))
    return {
      label: 'CHZZK 라이브',
      icon: Tv,
      className:
        'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30',
    };
  return {
    label: '방송 링크',
    icon: ExternalLink,
    className:
      'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30',
  };
}

export default function ScheduleDetailModalV2({
  schedule,
  streamers,
  games,
  clips = [],
  onScheduleUpdated,
}: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const { resolvedTheme } = useTheme();
  const toast = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState<SideTab>('clips');

  const isUser = !!session;
  const isDark = resolvedTheme === 'dark';
  const isHoi4 = schedule.game?.isHoi4 ?? false;
  const gameColor = schedule.game?.id
    ? (getGameColor(schedule.game.id, isDark) ?? '#4f46e5')
    : '#4f46e5';

  const goBack = useGoBack('/calendar');

  const handleClose = () => {
    if (sheetOpen) {
      setSheetOpen(false);
      return;
    }
    if (isEditing) {
      setIsEditing(false);
      return;
    }
    goBack();
  };

  useEscapeKey(handleClose);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    const result = await deleteScheduleRequest(schedule.id);
    setIsDeleting(false);
    setShowConfirm(false);
    if (result.success) {
      toast.success('일정이 삭제되었습니다.');
      navigateToCalendarAfterDelete(router);
    } else {
      toast.error(result.error ?? '삭제에 실패했습니다.');
    }
  };

  const sidePanelProps = {
    clips,
    participants: schedule.participants,
    isHoi4,
    isDark,
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
      <div className="flex w-full sm:w-auto sm:flex-row sm:items-stretch sm:gap-3">
        {/* 메인 모달 */}
        <motion.div
          variants={smoothModalVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="relative bg-white dark:bg-slate-800 w-full sm:max-w-lg rounded-t-4xl sm:rounded-[2.5rem] shadow-2xl dark:shadow-slate-900/50 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90dvh] border border-slate-100 dark:border-slate-700"
          onClick={(e) => e.stopPropagation()}
        >
          {isEditing ? (
            <EditView
              schedule={schedule}
              streamers={streamers}
              games={games}
              onBack={() => setIsEditing(false)}
              onScheduleUpdated={onScheduleUpdated}
              onSave={() => {
                setIsEditing(false);
                router.refresh();
              }}
            />
          ) : (
            <DetailViewV2
              schedule={schedule}
              gameColor={gameColor}
              isUser={isUser}
              isDark={isDark}
              isHoi4={isHoi4}
              clips={clips}
              onEdit={() => setIsEditing(true)}
              onDelete={() => setShowConfirm(true)}
              onClose={handleClose}
              onOpenSheet={(tab) => {
                setSheetTab(tab);
                setSheetOpen(true);
              }}
            />
          )}
        </motion.div>

        {/* 데스크탑 사이드패널 */}
        <AnimatePresence>
          {!isEditing && (
            <motion.div
              key="side-panel"
              variants={companionPanelVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="hidden max-h-[90dvh] min-h-0 w-72 flex-col overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/50 sm:flex"
              onClick={(e) => e.stopPropagation()}
            >
              <SidePanel {...sidePanelProps} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showConfirm && (
          <ConfirmModal
            message="정말로 이 일정을 삭제할까요? 되돌릴 수 없습니다."
            isLoading={isDeleting}
            onConfirm={handleConfirmDelete}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </AnimatePresence>

      {/* 모바일 바텀시트 */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              className="sm:hidden fixed inset-0 z-80 bg-black/40"
              variants={sheetBackdropVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-85 flex max-h-[75dvh] min-h-0 flex-col rounded-t-3xl border-t border-slate-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800 sm:hidden"
              variants={bottomSheetVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex shrink-0 justify-center pb-1 pt-3">
                <div className="h-1 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <SidePanel
                  {...sidePanelProps}
                  onClose={() => setSheetOpen(false)}
                  defaultTab={sheetTab}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Edit View ──────────────────────────────────────────────────────
function EditView({
  schedule,
  streamers,
  games,
  onBack,
  onSave,
  onScheduleUpdated,
}: {
  schedule: FlattenedSchedule;
  streamers: Streamer[];
  games: Game[];
  onBack: () => void;
  onSave: () => void;
  onScheduleUpdated?: (schedule: FlattenedSchedule) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-slate-800">
      <div className="px-5 py-4 sm:px-8 sm:py-6 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center shrink-0 bg-slate-50/50 dark:bg-slate-700/30">
        <button
          onClick={onBack}
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
      <CreateScheduleModal
        embedded
        initialData={schedule}
        isEdit
        streamers={streamers}
        games={games}
        onClose={onSave}
        onCancel={onBack}
        onScheduleUpdated={onScheduleUpdated}
      />
    </div>
  );
}

// ── Detail View V2 ────────────────────────────────────────────────
function DetailViewV2({
  schedule,
  gameColor,
  isUser,
  isDark,
  isHoi4,
  clips,
  onEdit,
  onDelete,
  onClose,
  onOpenSheet,
}: {
  schedule: FlattenedSchedule;
  gameColor: string;
  isUser: boolean;
  isDark: boolean;
  isHoi4: boolean;
  clips: ClipForSchedule[];
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  onOpenSheet: (tab: SideTab) => void;
}) {
  useMinuteClock();
  const broadcastStarted = hasScheduleBroadcastStarted(schedule);
  const liveUrls = filterScheduleLiveUrls(schedule.liveUrls ?? [], schedule);

  return (
    <>
      {/* 컬러 헤더 */}
      <div
        className="relative h-16 w-full shrink-0 transition-colors duration-500"
        style={{ backgroundColor: gameColor }}
      >
        <div
          className="absolute inset-0 opacity-25"
          style={{
            background:
              'linear-gradient(135deg, #ffffff33 0%, transparent 55%)',
          }}
        />
        <button
          onClick={onClose}
          className="absolute top-1/2 -translate-y-1/2 right-4 p-2 sm:p-2.5 bg-black/10 hover:bg-black/25 text-white rounded-full backdrop-blur-sm transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 제목 */}
      <div className="px-5 pt-6 pb-4 sm:px-8 sm:pt-7 sm:pb-5 shrink-0">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
          {schedule.title}
        </h2>
      </div>

      {/* 메타 칩 */}
      <div className="flex flex-wrap gap-2.5 px-5 pb-5 sm:px-8 sm:pb-6 shrink-0">
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-2xl font-bold text-sm border border-amber-100 dark:border-amber-800 shadow-sm">
          <Gamepad2 className="w-4 h-4" />
          <span>{schedule.game?.title || '기타 방송'}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 font-bold text-sm border border-slate-100 dark:border-slate-600">
          <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          {format(new Date(schedule.startTime), 'yyyy년 M월 d일 (eee)', {
            locale: ko,
          })}
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 font-bold text-sm border border-slate-100 dark:border-slate-600">
          <Clock className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          {schedule.isGuerrilla
            ? '시간 미정'
            : format(new Date(schedule.startTime), 'a h:mm', { locale: ko })}
        </div>
      </div>

      <div className="overflow-y-auto flex-1 min-h-0 overscroll-y-contain custom-scrollbar bg-white dark:bg-slate-800">
        {/* 참여 방송인 */}
        <div className="px-5 py-5 sm:px-8 sm:py-6 border-t border-slate-50 dark:border-slate-700 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
              Participants
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {schedule.participants.map((p) => {
              const color = getStreamerColor(p.id, isDark) ?? p.colorCode;
              const localAvatarPath = getStreamerImagePath(p.name);
              return (
                <Link
                  key={p.id}
                  href={`/streamers/detail/${p.id}`}
                  className="inline-flex items-center gap-2 pl-1 pr-3 py-1.5 bg-white dark:bg-slate-700/60 border border-slate-100 dark:border-slate-600 rounded-2xl hover:border-slate-200 dark:hover:border-slate-500 hover:scale-[1.03] transition-all shadow-sm"
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0 overflow-hidden"
                    style={{ backgroundColor: color }}
                  >
                    {p.profileImg ? (
                      <img
                        src={localAvatarPath}
                        alt={`${p.name} 프로필`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src.includes(encodeURIComponent(p.name))) {
                            target.src =
                              p.profileImg || '/images/default-avatar.svg';
                            return;
                          }
                          target.src = '/images/default-avatar.svg';
                        }}
                      />
                    ) : (
                      <img
                        src={localAvatarPath}
                        alt={`${p.name} 프로필`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/images/default-avatar.svg';
                        }}
                      />
                    )}
                  </span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {p.name}
                  </span>
                  {p.isGuest && (
                    <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-black text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                      게스트
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* 멀티뷰 CTA */}
          {schedule.participants.length >= 2 && broadcastStarted && (
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
                <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                  멀티뷰로 함께 보기
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  {schedule.participants.length}명의 방송을 한 화면에서
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-indigo-400 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          )}
        </div>

        <div className="px-5 pt-2 pb-0 sm:px-8">
          <ScheduleShareButton schedule={schedule} />
        </div>

        {/* VOD / Live */}
        <div className="px-5 py-5 sm:px-8 sm:py-6 border-t border-slate-50 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
              VOD / Live
            </span>
          </div>
          {liveUrls.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {liveUrls.map((url) => {
                const { label, icon: Icon, className } = getLinkMeta(url);
                return (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl border font-bold text-sm transition-all active:scale-95 ${className}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 text-sm font-bold">
              <ExternalLink className="w-4 h-4 opacity-50" />
              아직 등록된 링크가 없어요
            </div>
          )}
        </div>

        {/* 모바일 클립/전적 버튼 */}
        <div className="sm:hidden px-5 pt-3 pb-safe border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex gap-2">
          <button
            onClick={() => onOpenSheet('clips')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-700 transition-all"
          >
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
              클립
            </span>
            {clips.length > 0 && (
              <span className="text-[10px] font-black text-white bg-indigo-500 rounded-full px-1.5 py-0.5 leading-none">
                {clips.length}
              </span>
            )}
          </button>
          {isHoi4 && (
            <button
              onClick={() => onOpenSheet('hoi4')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-amber-100 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-all"
            >
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                전적
              </span>
            </button>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex gap-3 px-5 pt-4 pb-6 sm:px-8 border-t border-slate-100 dark:border-slate-700 shrink-0">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-3xl font-black hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-xl shadow-slate-200 dark:shadow-indigo-900/30 active:scale-95"
          >
            <Edit2 className="w-4 h-4" />
            내용 수정하기
          </button>
          <button
            onClick={onDelete}
            className="p-3.5 sm:p-4 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-3xl border border-red-100 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all active:scale-95"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  );
}
