'use client';

import { useState } from 'react';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Edit2, Trash2, Clock, Users, Gamepad2, Calendar,
  ChevronLeft, ExternalLink, Play, Tv, ArrowUpRight, LayoutGrid,
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useGoBack } from '@/hooks/useGoBack';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { deleteScheduleAction } from '@/app/actions';
import CreateScheduleModal from '../Form/CreateScheduleModal';
import { useToast } from '@/components/Common/Toaster';
import ConfirmModal from '@/components/Common/ConfirmModal';
import { backdropVariants, smoothModalVariants } from '@/lib/modalVariants';
import { getGameColor } from '@/constants/gamecolor';
import { getStreamerColor } from '@/constants/streamercolor';
import Link from 'next/link';
import type { Streamer, Game } from '@prisma/client';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';
import { SidePanel, type ClipForSchedule, type SideTab } from './ScheduleSidePanel';

interface Props {
  schedule: FlattenedSchedule;
  streamers: Streamer[];
  games: Game[];
  clips?: ClipForSchedule[];
}

function getLinkMeta(url: string) {
  if (url.includes('youtube.com') || url.includes('youtu.be'))
    return { label: 'YouTube 다시보기', icon: Play, color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' };
  if (url.includes('chzzk.naver.com'))
    return { label: 'CHZZK 라이브', icon: Tv, color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' };
  return { label: '방송 링크', icon: ExternalLink, color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' };
}

export default function ScheduleDetailModalV2({ schedule, streamers, games, clips = [] }: Props) {
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
  const gameColor = schedule.game?.id ? (getGameColor(schedule.game.id, isDark) ?? '#ef4444') : '#ef4444';

  const goBack = useGoBack('/calendar');

  const handleClose = () => {
    if (sheetOpen) { setSheetOpen(false); return; }
    if (isEditing) { setIsEditing(false); return; }
    goBack();
  };

  useEscapeKey(handleClose);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    const result = await deleteScheduleAction(schedule.id);
    setIsDeleting(false);
    setShowConfirm(false);
    if (result.success) {
      toast.success('일정이 삭제되었습니다.');
      router.refresh();
      router.push('/calendar');
    } else {
      toast.error('삭제에 실패했습니다.');
    }
  };

  const sidePanelProps = { clips, participants: schedule.participants, isHoi4, isDark };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={backdropVariants}
      className="fixed inset-0 z-70 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md"
      onClick={handleClose}
    >
      <div className="flex sm:flex-row sm:items-start sm:gap-3 w-full sm:w-auto">

        {/* 메인 모달 */}
        <motion.div
          variants={smoothModalVariants}
          className="relative bg-white dark:bg-slate-900 w-full sm:w-[440px] rounded-t-4xl sm:rounded-3xl shadow-2xl dark:shadow-black/50 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90dvh]"
          onClick={(e) => e.stopPropagation()}
        >
          {isEditing ? (
            <EditView
              schedule={schedule}
              streamers={streamers}
              games={games}
              onBack={() => setIsEditing(false)}
              onSave={() => { setIsEditing(false); router.refresh(); }}
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
              onOpenSheet={(tab) => { setSheetTab(tab); setSheetOpen(true); }}
            />
          )}
        </motion.div>

        {/* 데스크탑 사이드패널 */}
        <AnimatePresence>
          {!isEditing && (
            <motion.div
              key="side-panel"
              className="hidden sm:flex flex-col bg-white dark:bg-slate-900 w-60 rounded-3xl shadow-2xl dark:shadow-black/50 overflow-hidden max-h-[90dvh]"
              initial={{ opacity: 0, x: 16, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 16, scale: 0.97 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              className="sm:hidden fixed inset-x-0 bottom-0 z-85 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-100 dark:border-slate-800 flex flex-col max-h-[75dvh]"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
              </div>
              <SidePanel {...sidePanelProps} onClose={() => setSheetOpen(false)} defaultTab={sheetTab} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Edit View (기존과 동일) ────────────────────────────────────────
function EditView({ schedule, streamers, games, onBack, onSave }: {
  schedule: FlattenedSchedule;
  streamers: Streamer[];
  games: Game[];
  onBack: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          상세보기
        </button>
        <h3 className="text-base font-black text-slate-800 dark:text-white">일정 수정</h3>
        <div className="w-10" />
      </div>
      <div className="p-5 overflow-y-auto flex-1 min-h-0">
        <CreateScheduleModal
          initialData={schedule}
          isEdit={true}
          streamers={streamers}
          games={games}
          onClose={onSave}
        />
      </div>
    </div>
  );
}

// ── Detail View V2 ────────────────────────────────────────────────
function DetailViewV2({ schedule, gameColor, isUser, isDark, isHoi4, clips, onEdit, onDelete, onClose, onOpenSheet }: {
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
  return (
    <>
      {/* 상단 액센트 바 */}
      <div className="h-2 w-full shrink-0" style={{ background: `linear-gradient(90deg, ${gameColor}, ${gameColor}99)` }} />

      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4 px-[22px] pt-[22px] pb-4 shrink-0">
        <h2 className="text-[22px] font-black text-slate-900 dark:text-white leading-snug tracking-tight">
          {schedule.title}
        </h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0 mt-0.5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 메타 칩 */}
      <div className="flex flex-wrap gap-1.5 px-[22px] pb-[18px] shrink-0">
        {schedule.game && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[12px] font-bold">
            <Gamepad2 className="w-3 h-3" />
            {schedule.game.title}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[12px] font-bold">
          <Calendar className="w-3 h-3" />
          {format(new Date(schedule.startTime), 'yyyy년 M월 d일 (eee)', { locale: ko })}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[12px] font-bold">
          <Clock className="w-3 h-3" />
          {schedule.isGuerrilla ? '시간 미정' : format(new Date(schedule.startTime), 'a h:mm', { locale: ko })}
        </span>
      </div>

      <div className="overflow-y-auto flex-1 min-h-0">
        {/* 참여 방송인 */}
        <div className="px-[22px] py-[14px] border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Users className="w-3 h-3 text-slate-400 dark:text-slate-500" />
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              참여 방송인 · {schedule.participants.length}명
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {schedule.participants.map((p) => {
              const color = getStreamerColor(p.id, isDark) ?? p.colorCode;
              return (
                <Link
                  key={p.id}
                  href={`/streamers/detail/${p.id}`}
                  className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full hover:border-slate-200 dark:hover:border-slate-600 transition-colors"
                >
                  <span
                    className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {p.name[0]}
                  </span>
                  <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">{p.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 멀티뷰 CTA */}
        {schedule.participants.length >= 2 && (
          <div className="px-[22px] py-[14px] border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 mb-2.5">
              <LayoutGrid className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">멀티뷰</span>
            </div>
            <Link
              href={`/calendar/schedule/${schedule.id}/multiview`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3.5 py-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                  <LayoutGrid className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-[13px] font-black text-slate-800 dark:text-white">멀티뷰로 함께 보기</p>
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                    {schedule.participants.length}명의 방송을 한 화면에서
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        )}

        {/* VOD / Live */}
        <div className="px-[22px] py-[14px] border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 mb-2.5">
            <ExternalLink className="w-3 h-3 text-slate-400 dark:text-slate-500" />
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">VOD / Live</span>
          </div>
          {schedule.liveUrl ? (() => {
            const { label, icon: Icon, color } = getLinkMeta(schedule.liveUrl);
            return (
              <a
                href={schedule.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-black transition-colors ${color}`}
              >
                <Icon className="w-3 h-3" />
                {label}
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            );
          })() : (
            <div className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-[12px] font-semibold text-slate-400 dark:text-slate-500">
              <ExternalLink className="w-3 h-3 opacity-50" />
              아직 등록된 링크가 없어요
            </div>
          )}
        </div>

        {/* 모바일 클립/전적 버튼 */}
        <div className="sm:hidden px-[22px] py-[14px] border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button
            onClick={() => onOpenSheet('clips')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[12px] font-bold text-slate-600 dark:text-slate-300"
          >
            클립
            {clips.length > 0 && (
              <span className="text-[10px] font-black text-white bg-indigo-500 rounded-full px-1.5 py-px leading-none">
                {clips.length}
              </span>
            )}
          </button>
          {isHoi4 && (
            <button
              onClick={() => onOpenSheet('hoi4')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/40 text-[12px] font-bold text-amber-600 dark:text-amber-400"
            >
              전적
            </button>
          )}
        </div>
      </div>

      {/* 푸터 */}
      {isUser && (
        <div className="flex gap-2 px-[22px] pt-[14px] pb-[22px] border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-[13px] font-black hover:bg-slate-800 dark:hover:bg-white transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            내용 수정하기
          </button>
          <button
            onClick={onDelete}
            className="w-[46px] h-[46px] flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-100 dark:border-red-800/50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
