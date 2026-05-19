'use client';

import { ExternalLink, Trash2, Play, Tv, Pencil, ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import type { ClipWithParticipants } from '@/types/entities';
import { deleteClipAction } from '@/app/actions';
import { useSession } from 'next-auth/react';
import { extractChzzkClipId } from '@/lib/chzzk';
import { useToast } from '@/components/Common/Toaster';
import ConfirmModal from '@/components/Common/ConfirmModal';
import { track } from '@vercel/analytics';
import { ClipPlayerModal } from './ClipPlayerModal';

interface ClipCardProps {
  clip: ClipWithParticipants;
  onEdit?: (clip: ClipWithParticipants) => void;
}

export default function ClipCard({ clip, onEdit }: ClipCardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  const chzzkClipId = extractChzzkClipId(clip.url);
  const canPlayInline = chzzkClipId !== null;

  const openPlayer = () => {
    track('clip_viewed', {
      clip_id: clip.id,
      clip_title: clip.title,
      method: 'inline',
      streamer: clip.participants.map((p) => p.streamer.name).join(', '),
    });
    setShowPlayer(true);
  };

  const trackExternal = () => {
    track('clip_viewed', {
      clip_id: clip.id,
      clip_title: clip.title,
      method: 'external',
      streamer: clip.participants.map((p) => p.streamer.name).join(', '),
    });
  };

  const formattedDate = clip.clipDate
    ? new Date(clip.clipDate).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(true);
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    const result = await deleteClipAction(clip.id);
    setDeleting(false);
    setShowConfirm(false);
    if (result.success) {
      toast.success('클립이 삭제되었습니다.');
      router.refresh();
    } else {
      toast.error('삭제에 실패했습니다.');
    }
  }

  return (
    <>
      <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white transition-all hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700 dark:hover:shadow-indigo-950/50 sm:rounded-3xl">

        {/* 미디어 영역 */}
        <div className="relative aspect-video bg-black overflow-hidden">
          {clip.thumbnailUrl ? (
            /* 썸네일 있음 */
            canPlayInline ? (
              <button
                onClick={openPlayer}
                className="absolute inset-0 w-full h-full group/thumb"
                aria-label={`${clip.title} 재생`}
              >
                <Image
                  src={clip.thumbnailUrl}
                  alt={clip.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"

                />
                <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/25 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                    <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                  </div>
                </div>
              </button>
            ) : (
              <a href={clip.url} target="_blank" rel="noopener noreferrer" onClick={trackExternal} className="absolute inset-0">
                <Image
                  src={clip.thumbnailUrl}
                  alt={clip.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"

                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                  </div>
                </div>
              </a>
            )
          ) : canPlayInline ? (
            /* 썸네일 없음 + 치지직 */
            <button
              onClick={openPlayer}
              className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-2 bg-[#0B0E13] group/play"
              aria-label={`${clip.title} 재생`}
            >
              <div className="absolute inset-0 bg-linear-to-br from-[#00FFA3]/10 to-transparent" />
              <div className="relative w-14 h-14 rounded-full bg-white/10 group-hover/play:bg-[#00FFA3]/20 border border-white/20 group-hover/play:border-[#00FFA3]/50 flex items-center justify-center transition-all duration-300">
                <Play className="w-7 h-7 text-white fill-white ml-1 group-hover/play:text-[#00FFA3] group-hover/play:fill-[#00FFA3] transition-colors" />
              </div>
              <span className="relative text-[11px] font-black text-white/60 group-hover/play:text-[#00FFA3] tracking-wider uppercase transition-colors">
                클릭해서 재생
              </span>
            </button>
          ) : (
            /* 썸네일 없음 + 외부 링크 */
            <a
              href={clip.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackExternal}
              className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800"
            >
              <Play className="w-12 h-12 text-slate-300 dark:text-slate-600" />
            </a>
          )}
        </div>

        {/* 정보 영역 */}
        <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-black text-slate-800 dark:text-white text-sm leading-snug line-clamp-2 flex-1">
              {clip.title}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              <a
                href={clip.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                aria-label="클립 외부 링크"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              {session && (
                <>
                  <button
                    onClick={() => onEdit?.(clip)}
                    className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                    aria-label="클립 수정"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all disabled:opacity-50"
                    aria-label="클립 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {clip.description && (
            <p className="text-xs leading-4 text-slate-400 dark:text-slate-500 line-clamp-2">
              {clip.description}
            </p>
          )}

          {clip.schedule && (
            <Link
              href={`/calendar/schedule/${clip.schedule.id}`}
              className="group/sched flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:border-indigo-200 dark:hover:border-indigo-700 transition-all"
            >
              <Tv className="w-3 h-3 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 line-clamp-1 flex-1">
                {clip.schedule.title}
              </span>
              <ArrowUpRight className="w-3 h-3 text-indigo-400 dark:text-indigo-500 shrink-0 opacity-0 group-hover/sched:opacity-100 transition-opacity" />
            </Link>
          )}

          <div className="flex flex-wrap gap-1.5 mt-auto pt-2 items-center">
            {clip.participants.map(({ streamer }) => (
              <span
                key={streamer.id}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: `${streamer.colorCode}20`,
                  borderColor: `${streamer.colorCode}50`,
                  color: streamer.colorCode,
                }}
              >
                {streamer.name}
              </span>
            ))}
            {formattedDate && (
              <span className="ml-auto text-[10px] font-bold text-slate-400 dark:text-slate-500 self-center">
                {formattedDate}
              </span>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPlayer && chzzkClipId && (
          <ClipPlayerModal
            url={clip.url}
            clipId={chzzkClipId}
            title={clip.title}
            onClose={() => setShowPlayer(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirm && (
          <ConfirmModal
            message="이 클립을 삭제할까요? 되돌릴 수 없습니다."
            isLoading={deleting}
            onConfirm={handleConfirmDelete}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
