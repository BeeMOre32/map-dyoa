'use client';

import { ExternalLink, Trash2, Play, Tv, Pencil, ArrowUpRight, Loader2, VolumeX, Volume2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { clipCardVariants } from '@/lib/clipMotion';
import { useRouter } from 'next/navigation';
import type { ClipWithParticipants } from '@/types/entities';
import { deleteClipAction } from '@/app/actions';
import { useSession } from 'next-auth/react';
import { extractChzzkClipId } from '@/lib/chzzk';
import { useToast } from '@/components/Common/Toaster';
import ConfirmModal from '@/components/Common/ConfirmModal';
import { track } from '@vercel/analytics';
import {
  claimClipHoverPreview,
  releaseClipHoverPreview,
} from '@/lib/clip-hover-preview';
import { postToChzzkIframe } from '@/components/multiview/utils';
import { ClipPlayerModal } from './ClipPlayerModal';

/** 호버 후 미리보기 iframe 마운트까지 */
const HOVER_PLAY_MS = 1000;
const HOVER_CLOSE_MS = 120;
const CLIP_QUIET_VOLUME = 0.15;

function canHoverPreview() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

interface ClipCardProps {
  clip: ClipWithParticipants;
  onEdit?: (clip: ClipWithParticipants) => void;
  index?: number;
}

export default function ClipCard({ clip, onEdit, index = 0 }: ClipCardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [hoverPreview, setHoverPreview] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  /** 실제 재생 시작 후에만 썸네일 숨김 (onLoad만으로는 검은 화면) */
  const [previewPlaying, setPreviewPlaying] = useState(false);
  /** locked | awaiting(화면 클릭 대기) | open */
  const [audioGate, setAudioGate] = useState<'locked' | 'awaiting' | 'open'>(
    'locked',
  );

  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const audioGateRef = useRef(audioGate);
  audioGateRef.current = audioGate;

  const chzzkClipId = extractChzzkClipId(clip.url);
  const canPlayInline = chzzkClipId !== null;
  const awaitingAudioClick = audioGate === 'awaiting';
  const soundOn = audioGate === 'open';

  const clearTimers = useCallback(() => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const requestClipUnmute = useCallback(() => {
    // iframe 클릭 시 부모 mouseleave로 미리보기가 닫히지 않게 타이머 제거
    clearTimers();
    setAudioGate('awaiting');
    const iframe = iframeRef.current;
    postToChzzkIframe(iframe, 'request-unmute');
    postToChzzkIframe(iframe, 'set-volume', { volume: CLIP_QUIET_VOLUME });
    postToChzzkIframe(iframe, 'toggle-mute', { muted: false });
  }, [clearTimers]);

  const muteClip = useCallback(() => {
    setAudioGate('locked');
    postToChzzkIframe(iframeRef.current, 'toggle-mute', { muted: true });
  }, []);

  const stopHoverPreview = useCallback(() => {
    clearTimers();
    setAudioGate('locked');
    postToChzzkIframe(iframeRef.current, 'toggle-mute', { muted: true });
    setHoverPreview(false);
    setIframeLoaded(false);
    setPreviewPlaying(false);
    releaseClipHoverPreview(clip.id);
  }, [clearTimers, clip.id]);

  const startHoverPreview = useCallback(() => {
    if (!canPlayInline || showPlayer) return;
    claimClipHoverPreview(clip.id, () => {
      clearTimers();
      setAudioGate('locked');
      setHoverPreview(false);
      setIframeLoaded(false);
      setPreviewPlaying(false);
    });
    setIframeLoaded(false);
    setPreviewPlaying(false);
    setAudioGate('locked');
    setHoverPreview(true);
  }, [canPlayInline, clearTimers, clip.id, showPlayer]);

  const onMediaEnter = () => {
    if (!canPlayInline || showPlayer || !canHoverPreview()) return;
    clearTimers();
    // 소리 켜는 중이면 미리보기 유지 (iframe 클릭 후 복귀)
    if (audioGateRef.current === 'awaiting' || audioGateRef.current === 'open') {
      return;
    }
    if (!hoverPreview) {
      openTimer.current = setTimeout(() => startHoverPreview(), HOVER_PLAY_MS);
    }
  };

  const onMediaLeave = () => {
    // iframe은 별도 문서라 포인터가 들어가면 부모에 mouseleave가 발생함.
    // 소리 켜기 위해 화면 클릭하는 동안에는 미리보기를 닫지 않음.
    if (audioGateRef.current === 'awaiting') return;
    clearTimers();
    closeTimer.current = setTimeout(() => stopHoverPreview(), HOVER_CLOSE_MS);
  };

  useEffect(() => () => stopHoverPreview(), [stopHoverPreview]);

  useEffect(() => {
    if (showPlayer) stopHoverPreview();
  }, [showPlayer, stopHoverPreview]);

  // 확장에서 재생 시작·소리 해제 신호
  useEffect(() => {
    if (!hoverPreview) return;
    const onMsg = (ev: MessageEvent) => {
      if (ev.data?.source !== 'map-dyoa-chzzk') return;
      if (ev.data?.type === 'clip-preview-playing') {
        setPreviewPlaying(true);
      }
      if (ev.data?.type === 'audio-unlocked') {
        clearTimers();
        setAudioGate('open');
      }
    };
    window.addEventListener('message', onMsg);
    const fallback = window.setTimeout(() => {
      setIframeLoaded((loaded) => loaded);
    }, 5000);
    return () => {
      window.removeEventListener('message', onMsg);
      window.clearTimeout(fallback);
    };
  }, [hoverPreview, clearTimers]);

  // 화면 클릭 대기 타임아웃
  useEffect(() => {
    if (audioGate !== 'awaiting') return;
    const t = window.setTimeout(() => setAudioGate('locked'), 12000);
    return () => window.clearTimeout(t);
  }, [audioGate]);

  const openPlayer = () => {
    stopHoverPreview();
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
      <motion.article
        custom={index}
        initial="hidden"
        animate="visible"
        variants={clipCardVariants}
        whileHover={{ y: -3, transition: { type: 'spring', visualDuration: 0.22, bounce: 0.16 } }}
        whileTap={{ scale: 0.99 }}
        className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white transition-colors hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700 dark:hover:shadow-indigo-950/50 sm:rounded-3xl"
      >

        {/* 미디어 영역 — 치지직 클립은 호버 1초 후 인라인 미리보기 */}
        <div
          className="relative aspect-video overflow-hidden bg-black"
          onMouseEnter={onMediaEnter}
          onMouseLeave={onMediaLeave}
        >
          {clip.thumbnailUrl ? (
            canPlayInline ? (
              <>
                <Image
                  src={clip.thumbnailUrl}
                  alt={clip.title}
                  fill
                  className={`object-cover transition-all duration-300 ${
                    previewPlaying
                      ? 'opacity-0'
                      : 'opacity-100 group-hover:scale-105'
                  }`}
                />
                {hoverPreview && chzzkClipId ? (
                  <iframe
                    ref={iframeRef}
                    src={`https://chzzk.naver.com/embed/clip/${chzzkClipId}?map-dyoa-clip-preview=1`}
                    title={`${clip.title} 미리보기`}
                    className={`absolute inset-0 border-0 ${
                      awaitingAudioClick
                        ? 'pointer-events-auto z-[4] opacity-100'
                        : `pointer-events-none z-[1] ${previewPlaying ? 'opacity-100' : 'opacity-0'}`
                    }`}
                    allow="autoplay; clipboard-write; encrypted-media"
                    tabIndex={-1}
                    onLoad={() => setIframeLoaded(true)}
                  />
                ) : null}
                {hoverPreview && iframeLoaded && !previewPlaying ? (
                  <div className="absolute inset-0 z-[2] flex items-center justify-center bg-black/25">
                    <Loader2 className="h-6 w-6 animate-spin text-white/80" />
                  </div>
                ) : null}
                {awaitingAudioClick ? (
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-[6] flex justify-center px-2 pt-2">
                    <p className="rounded-lg bg-amber-500/95 px-2.5 py-1 text-center text-[10px] font-black text-white shadow-lg">
                      소리가 나려면 화면을 한 번 클릭하세요
                    </p>
                  </div>
                ) : null}
                {previewPlaying && !awaitingAudioClick ? (
                  <button
                    type="button"
                    className={`absolute bottom-2 left-2 z-[5] flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold shadow-lg transition-colors ${
                      soundOn
                        ? 'bg-emerald-500/90 text-white hover:bg-emerald-500'
                        : 'bg-black/75 text-white/90 hover:bg-black/90'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (soundOn) muteClip();
                      else requestClipUnmute();
                    }}
                  >
                    {soundOn ? (
                      <Volume2 className="h-3.5 w-3.5 shrink-0 opacity-90" />
                    ) : (
                      <VolumeX className="h-3.5 w-3.5 shrink-0 opacity-90" />
                    )}
                    <span className="truncate">
                      {soundOn ? '소리 켜짐 · 눌러 음소거' : '음소거 중 · 소리 켜기'}
                    </span>
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={openPlayer}
                  className={`absolute inset-0 z-[3] h-full w-full group/thumb ${
                    awaitingAudioClick ? 'pointer-events-none' : ''
                  }`}
                  aria-label={`${clip.title} 재생`}
                >
                  {!previewPlaying ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover/thumb:bg-black/25">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 opacity-0 backdrop-blur-sm transition-opacity group-hover/thumb:opacity-100">
                        <Play className="ml-0.5 h-6 w-6 fill-white text-white" />
                      </div>
                    </div>
                  ) : null}
                </button>
              </>
            ) : (
              <a
                href={clip.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={trackExternal}
                className="absolute inset-0"
              >
                <Image
                  src={clip.thumbnailUrl}
                  alt={clip.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                    <Play className="ml-0.5 h-6 w-6 fill-white text-white" />
                  </div>
                </div>
              </a>
            )
          ) : canPlayInline ? (
            <>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0B0E13]">
                <div className="absolute inset-0 bg-linear-to-br from-[#00FFA3]/10 to-transparent" />
                {!previewPlaying ? (
                  <>
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10">
                      <Play className="ml-1 h-7 w-7 fill-white text-white" />
                    </div>
                    <span className="relative text-[11px] font-black uppercase tracking-wider text-white/60">
                      호버해서 미리보기
                    </span>
                  </>
                ) : null}
              </div>
              {hoverPreview && chzzkClipId ? (
                <iframe
                  ref={iframeRef}
                  src={`https://chzzk.naver.com/embed/clip/${chzzkClipId}?map-dyoa-clip-preview=1`}
                  title={`${clip.title} 미리보기`}
                  className={`absolute inset-0 border-0 ${
                    awaitingAudioClick
                      ? 'pointer-events-auto z-[4] opacity-100'
                      : `pointer-events-none z-[1] ${previewPlaying ? 'opacity-100' : 'opacity-0'}`
                  }`}
                  allow="autoplay; clipboard-write; encrypted-media"
                  tabIndex={-1}
                  onLoad={() => setIframeLoaded(true)}
                />
              ) : null}
              {hoverPreview && iframeLoaded && !previewPlaying ? (
                <div className="absolute inset-0 z-[2] flex items-center justify-center bg-black/25">
                  <Loader2 className="h-6 w-6 animate-spin text-white/80" />
                </div>
              ) : null}
              {awaitingAudioClick ? (
                <div className="pointer-events-none absolute inset-x-0 top-0 z-[6] flex justify-center px-2 pt-2">
                  <p className="rounded-lg bg-amber-500/95 px-2.5 py-1 text-center text-[10px] font-black text-white shadow-lg">
                    소리가 나려면 화면을 한 번 클릭하세요
                  </p>
                </div>
              ) : null}
              {previewPlaying && !awaitingAudioClick ? (
                <button
                  type="button"
                  className={`absolute bottom-2 left-2 z-[5] flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold shadow-lg transition-colors ${
                    soundOn
                      ? 'bg-emerald-500/90 text-white hover:bg-emerald-500'
                      : 'bg-black/75 text-white/90 hover:bg-black/90'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (soundOn) muteClip();
                    else requestClipUnmute();
                  }}
                >
                  {soundOn ? (
                    <Volume2 className="h-3.5 w-3.5 shrink-0 opacity-90" />
                  ) : (
                    <VolumeX className="h-3.5 w-3.5 shrink-0 opacity-90" />
                  )}
                  <span className="truncate">
                    {soundOn ? '소리 켜짐 · 눌러 음소거' : '음소거 중 · 소리 켜기'}
                  </span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={openPlayer}
                className={`absolute inset-0 z-[3] h-full w-full ${
                  awaitingAudioClick ? 'pointer-events-none' : ''
                }`}
                aria-label={`${clip.title} 재생`}
              />
            </>
          ) : (
            <a
              href={clip.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackExternal}
              className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800"
            >
              <Play className="h-12 w-12 text-slate-300 dark:text-slate-600" />
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
      </motion.article>

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
