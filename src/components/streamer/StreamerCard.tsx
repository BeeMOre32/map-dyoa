'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, LayoutGrid, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Streamer } from '@prisma/client';
import { getStreamerImagePath } from '@/lib/utils';
import { useIsDarkAfterMount } from '@/hooks/useIsDarkAfterMount';
import { getStreamerColor } from '@/constants/streamercolor';
import { getChannelUrl } from '@/components/multiview/utils';
import { streamerAvatarLayoutId, streamerCardVariants } from '@/lib/streamerMotion';
import StreamerAvatar from './StreamerAvatar';
import StreamerLivePreview from './StreamerLivePreview';
import { track } from '@vercel/analytics';
import { markModalSoftNav } from '@/lib/modal-navigation';
import {
  claimLiveEmbed,
  isLiveEmbedHeld,
  releaseLiveEmbed,
} from '@/lib/streamer-live-preview';

interface StreamerCardProps {
  streamer: Streamer;
  onRequestEdit: (streamer: Streamer) => void;
  isLive?: boolean;
  isSelected?: boolean;
  isMaxReached?: boolean;
  onToggleMultiview?: () => void;
  selectionIndex?: number;
  /** 그리드 stagger 오프셋 */
  index?: number;
}

/** chzzk-plus: 사이드바 mouseover 즉시 표시에 가깝게, 닫기는 ~100ms */
const HOVER_OPEN_MS = 280;
const HOVER_CLOSE_MS = 100;

function canHoverPreview() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

export default function StreamerCard({
  streamer,
  onRequestEdit,
  isLive = false,
  isSelected = false,
  isMaxReached = false,
  onToggleMultiview,
  selectionIndex,
  index = 0,
}: StreamerCardProps) {
  const imgSrc = streamer.profileImg ?? getStreamerImagePath(streamer.name);
  const isDark = useIsDarkAfterMount();
  const streamerColor = getStreamerColor(streamer.id, isDark) ?? streamer.colorCode;
  const channelUrl = getChannelUrl(streamer);
  const canSelect = isSelected || !isMaxReached;

  const cardRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewHovered = useRef(false);
  const previewPinned = useRef(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [anchor, setAnchor] = useState<{
    top: number;
    left: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  } | null>(null);

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

  const measureAnchor = useCallback(() => {
    const el = cardRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      top: r.top,
      left: r.left,
      right: r.right,
      bottom: r.bottom,
      width: r.width,
      height: r.height,
    };
  }, []);

  const closePreview = useCallback(() => {
    clearTimers();
    previewHovered.current = false;
    previewPinned.current = false;
    setPreviewOpen(false);
    setAnchor(null);
    releaseLiveEmbed(streamer.id, 'hover');
  }, [clearTimers, streamer.id]);

  const openPreview = useCallback(() => {
    if (!isLive) return;
    // 상세 사이드패널에서 같은 스트림을 이미 재생 중이면 호버 iframe 중복 방지
    if (isLiveEmbedHeld(streamer.id, 'detail')) return;
    const next = measureAnchor();
    if (!next) return;
    const claimed = claimLiveEmbed(streamer.id, 'hover', () => {
      clearTimers();
      previewHovered.current = false;
      previewPinned.current = false;
      setPreviewOpen(false);
      setAnchor(null);
      releaseLiveEmbed(streamer.id, 'hover');
    });
    if (!claimed) return;
    setAnchor(next);
    setPreviewOpen(true);
    track('streamer_live_preview_open', {
      streamer_id: streamer.id,
      streamer_name: streamer.name,
    });
  }, [clearTimers, isLive, measureAnchor, streamer.id, streamer.name]);

  const scheduleOpen = useCallback(() => {
    if (!isLive || !canHoverPreview()) return;
    if (isLiveEmbedHeld(streamer.id, 'detail')) return;
    clearTimers();
    openTimer.current = setTimeout(() => openPreview(), HOVER_OPEN_MS);
  }, [clearTimers, isLive, openPreview, streamer.id]);

  const scheduleClose = useCallback(() => {
    if (previewPinned.current) return;
    clearTimers();
    closeTimer.current = setTimeout(() => {
      if (previewHovered.current || previewPinned.current) return;
      closePreview();
    }, HOVER_CLOSE_MS);
  }, [clearTimers, closePreview]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    if (!isLive && previewOpen) closePreview();
  }, [isLive, previewOpen, closePreview]);

  const borderCls = isSelected
    ? 'border-indigo-500 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/30'
    : isLive
      ? 'border-red-200 dark:border-red-900/60 shadow-[0_4px_24px_rgba(239,68,68,0.15)] dark:shadow-[0_4px_24px_rgba(239,68,68,0.10)] hover:border-red-300 dark:hover:border-red-800'
      : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-xl hover:shadow-indigo-50 dark:hover:shadow-indigo-950/50';

  const nameCls = isSelected
    ? 'text-indigo-600 dark:text-indigo-400'
    : isLive
      ? 'text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300'
      : 'text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400';

  const multiviewBtnCls = isSelected
    ? 'bg-indigo-500 text-white hover:bg-indigo-600'
    : canSelect
      ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400'
      : 'bg-slate-50 dark:bg-slate-800 text-slate-200 dark:text-slate-700 cursor-not-allowed';

  return (
    <motion.div
      ref={cardRef}
      custom={index}
      initial="hidden"
      animate="visible"
      variants={streamerCardVariants}
      whileHover={{ y: -2, transition: { type: 'spring', stiffness: 420, damping: 28 } }}
      whileTap={{ scale: 0.99, transition: { type: 'spring', stiffness: 500, damping: 32 } }}
      className="relative min-w-0 h-full"
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
    >
      <Link
        href={`/streamers/detail/${streamer.id}`}
        scroll={false}
        onClick={() => markModalSoftNav()}
        className={`group relative flex h-full cursor-pointer flex-col rounded-2xl border-2 bg-white p-3.5 transition-colors dark:bg-slate-900 sm:rounded-3xl sm:p-5 ${borderCls}`}
      >
        {isLive && !isSelected && (
          <motion.div
            className="absolute top-0 left-3.5 right-3.5 h-0.5 rounded-full bg-linear-to-r from-transparent via-red-400 to-transparent sm:left-5 sm:right-5"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        {isSelected && (
          <motion.div
            className="absolute top-0 left-3.5 right-3.5 h-0.5 rounded-full bg-linear-to-r from-transparent via-indigo-500 to-transparent sm:left-5 sm:right-5"
            layoutId={`streamer-select-${streamer.id}`}
          />
        )}

        <motion.div
          layout
          className="mb-2.5 flex items-start justify-between sm:mb-4"
          style={{ display: 'flex' }}
        >
          <div className="relative">
            <motion.div
              layoutId={streamerAvatarLayoutId(streamer.id)}
              className="relative h-11 w-11 overflow-hidden rounded-xl sm:h-14 sm:w-14 sm:rounded-2xl"
            >
              <StreamerAvatar
                name={streamer.name}
                imgSrc={imgSrc}
                colorCode={streamerColor}
                streamerId={streamer.id}
                size="medium"
              />
            </motion.div>
            {isLive && (
              <span className="absolute -bottom-0.5 -right-0.5 flex items-center gap-0.5 rounded-full bg-red-500 px-1 py-px text-[8px] font-black leading-none text-white shadow-md sm:-bottom-1 sm:-right-1 sm:px-1.5 sm:py-0.5 sm:text-[9px]">
                <span className="h-0.5 w-0.5 animate-pulse rounded-full bg-white sm:h-1 sm:w-1" />
                LIVE
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRequestEdit(streamer);
            }}
            className="rounded-lg p-1 text-slate-300 transition-all hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 sm:p-1.5"
          >
            <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </motion.div>

        <div className="space-y-0.5 sm:space-y-1">
          <h3 className={`text-base font-black transition-colors sm:text-lg ${nameCls}`}>
            {streamer.name}
          </h3>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 sm:text-sm">
            @{streamer.handle || 'nickname'}
          </p>
        </div>

        <div className="mt-3 flex items-center gap-1.5 sm:mt-6 sm:gap-2">
          <span className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400 sm:rounded-xl sm:px-2.5 sm:py-1 sm:text-[10px]">
            {streamer.generation}기
          </span>
          {streamer.role && (
            <span className="rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter text-indigo-600 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 sm:rounded-xl sm:px-2.5 sm:py-1 sm:text-[10px]">
              {streamer.role}
            </span>
          )}

          <motion.div
            layout
            className="ml-auto flex items-center gap-1 sm:gap-1.5"
            style={{ display: 'flex' }}
          >
            {isLive && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (previewOpen) {
                    closePreview();
                    return;
                  }
                  openPreview();
                }}
                title="라이브 미리보기"
                className={`flex h-7 items-center gap-1 rounded-lg px-2 text-[9px] font-black transition-all sm:h-8 sm:rounded-xl sm:px-2.5 sm:text-[10px] ${
                  previewOpen
                    ? 'bg-red-500 text-white'
                    : 'bg-red-50 text-red-600 opacity-100 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span className="[@media(hover:hover)]:hidden">미리보기</span>
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(channelUrl, '_blank', 'noopener,noreferrer');
              }}
              title="치지직 채널 방문"
              className="rounded-lg px-2 py-0.5 text-[9px] font-black text-white shadow-sm transition-all hover:opacity-80 active:scale-95 sm:rounded-xl sm:px-2.5 sm:py-1 sm:text-[10px]"
              style={{ backgroundColor: streamerColor }}
            >
              {streamer.platform || 'CHZZK'}
            </button>

            {onToggleMultiview && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!canSelect) return;
                  if (!isSelected) {
                    track('multiview_streamer_added', {
                      streamer_name: streamer.name,
                      streamer_id: streamer.id,
                      is_live: isLive,
                    });
                  }
                  onToggleMultiview();
                }}
                title={isSelected ? '멀티뷰에서 제거' : '멀티뷰에 추가'}
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black transition-all sm:h-8 sm:w-8 sm:rounded-xl sm:text-[13px] ${multiviewBtnCls}`}
              >
                {isSelected && selectionIndex != null ? (
                  selectionIndex
                ) : (
                  <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
              </button>
            )}
          </motion.div>
        </div>
      </Link>

      {previewOpen && anchor && (
        <StreamerLivePreview
          streamer={streamer}
          anchor={anchor}
          anchorEl={cardRef.current}
          onClose={closePreview}
          onPinnedChange={(pinned) => {
            previewPinned.current = pinned;
            if (pinned) clearTimers();
          }}
          onHoverChange={(hovering) => {
            previewHovered.current = hovering;
            if (hovering) clearTimers();
            else scheduleClose();
          }}
        />
      )}
    </motion.div>
  );
}
