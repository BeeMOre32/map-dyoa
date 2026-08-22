'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { ExternalLink, GripVertical, Pin, PinOff, X } from 'lucide-react';
import type { Streamer } from '@prisma/client';
import { getChannelUrl } from '@/components/multiview/utils';
import StreamerLiveEmbed from './StreamerLiveEmbed';

type AnchorRect = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

type Props = {
  streamer: Streamer;
  anchor: AnchorRect;
  onClose: () => void;
  onHoverChange?: (hovering: boolean) => void;
  /** 핀 고정 시 카드 mouseleave로 닫히지 않음 */
  onPinnedChange?: (pinned: boolean) => void;
  anchorEl?: HTMLElement | null;
};

const PREVIEW_W = 480;
const PREVIEW_H = 320;
const GAP = 8;

function computePosition(anchor: AnchorRect) {
  if (typeof window === 'undefined') return { top: 0, left: 0 };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.min(PREVIEW_W, vw - 24);
  const h = Math.min(PREVIEW_H, vh - 24);
  const spaceRight = vw - anchor.right;
  const spaceLeft = anchor.left;

  let top = anchor.bottom + GAP;
  let left = anchor.left;

  if (spaceRight >= w + GAP && spaceRight >= spaceLeft) {
    top = Math.min(Math.max(12, anchor.top), vh - h - 16);
    left = anchor.right + GAP;
  } else if (spaceLeft >= w + GAP) {
    top = Math.min(Math.max(12, anchor.top), vh - h - 16);
    left = anchor.left - w - GAP;
  } else {
    const spaceAbove = anchor.top;
    const spaceBelow = vh - anchor.bottom;
    if (spaceAbove > spaceBelow && spaceAbove >= h + GAP) {
      top = Math.max(12, anchor.top - h - GAP);
    } else {
      top = Math.min(anchor.bottom + GAP, vh - h - 16);
    }
    left = Math.min(
      Math.max(12, anchor.left + anchor.width / 2 - w / 2),
      vw - w - 12,
    );
  }

  top = Math.max(12, Math.min(top, vh - h - 12));
  left = Math.max(12, Math.min(left, vw - w - 12));
  return { top, left };
}

export default function StreamerLivePreview({
  streamer,
  anchor,
  onClose,
  onHoverChange,
  onPinnedChange,
  anchorEl,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const draggedRef = useRef(false);
  const [pos, setPos] = useState(() => computePosition(anchor));
  const [pinned, setPinned] = useState(false);
  const [liveTitle, setLiveTitle] = useState<string | null>(null);
  const channelUrl = getChannelUrl(streamer);
  const metaUrl = streamer.chzzkUrl ?? channelUrl;

  useLayoutEffect(() => {
    if (draggedRef.current) return;
    setPos(computePosition(anchor));
  }, [anchor]);

  useEffect(() => {
    onPinnedChange?.(pinned);
  }, [pinned, onPinnedChange]);

  useEffect(() => {
    let cancelled = false;
    setLiveTitle(null);
    void fetch(`/api/chzzk/live-meta?url=${encodeURIComponent(metaUrl)}`, {
      cache: 'no-store',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { title?: string | null } | null) => {
        if (cancelled || !json?.title?.trim()) return;
        setLiveTitle(json.title.trim());
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [metaUrl]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (pinned) return;
      const t = e.target as Node | null;
      if (!t) return;
      if (panelRef.current?.contains(t)) return;
      if (anchorEl?.contains(t)) return;
      onClose();
    };
    const onScroll = (e: Event) => {
      if (pinned) return;
      const t = e.target;
      if (t instanceof Node && panelRef.current?.contains(t)) return;
      onClose();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [onClose, anchorEl, pinned]);

  const startMove = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    draggedRef.current = true;
    document.body.style.userSelect = 'none';

    const onMove = (ev: MouseEvent) => {
      const w = rect.width;
      const h = rect.height;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setPos({
        left: Math.max(8, Math.min(ev.clientX - offsetX, vw - w - 8)),
        top: Math.max(8, Math.min(ev.clientY - offsetY, vh - h - 8)),
      });
    };
    const onUp = () => {
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  if (typeof document === 'undefined') return null;

  const titleText = liveTitle || `${streamer.name} 라이브`;

  return createPortal(
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, scale: 0.94, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className="fixed z-[60] w-[min(480px,calc(100vw-24px))] overflow-hidden rounded-lg bg-[#18181b] shadow-[0_0_16px_#000] ring-1 ring-white/10"
      style={{ top: pos.top, left: pos.left }}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => {
        if (!pinned) onHoverChange?.(false);
      }}
      role="dialog"
      aria-label={`${streamer.name} 라이브 미리보기`}
    >
      <div
        className="flex min-h-[1.8rem] cursor-move select-none items-center gap-2 bg-black/85 px-2 py-1"
        onMouseDown={startMove}
      >
        <GripVertical className="h-[19px] w-[19px] shrink-0 text-white/40" aria-hidden />
        <span className="shrink-0 rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-black tracking-wide text-white">
          LIVE
        </span>
        <p
          className="min-w-0 flex-1 break-words text-left text-[14px] leading-snug text-[#dfe2ea] line-clamp-2"
          title={titleText}
        >
          {titleText}
        </p>
        <button
          type="button"
          onClick={() => setPinned((v) => !v)}
          onMouseDown={(e) => e.stopPropagation()}
          className={`rounded p-1 transition-colors ${
            pinned
              ? 'text-cyan-400 opacity-100'
              : 'text-white/70 opacity-75 hover:opacity-100'
          }`}
          title={pinned ? '고정 해제' : '화면에 고정'}
          aria-label="고정"
        >
          {pinned ? <PinOff className="h-[18px] w-[18px]" /> : <Pin className="h-[18px] w-[18px]" />}
        </button>
        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded p-1 text-white/50 hover:text-white"
          title="치지직에서 열기"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-[18px] w-[18px]" />
        </a>
        <button
          type="button"
          onClick={onClose}
          onMouseDown={(e) => e.stopPropagation()}
          className="rounded p-1 text-white/50 hover:text-white"
          title="닫기"
        >
          <X className="h-[18px] w-[18px]" />
        </button>
      </div>

      <StreamerLiveEmbed streamer={streamer} showMeta />
    </motion.div>,
    document.body,
  );
}
