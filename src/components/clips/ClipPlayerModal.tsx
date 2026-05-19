'use client';

import { X, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import { useScrollLock } from '@/hooks/useScrollLock';
import { backdropVariants } from '@/lib/modalVariants';

interface ClipPlayerModalProps {
  url: string;
  clipId: string;
  title: string;
  onClose: () => void;
}

export function ClipPlayerModal({ url, clipId, title, onClose }: ClipPlayerModalProps) {
  const dismiss = useModalDismiss({ mother: '/clips', onClose });
  useEscapeKey(dismiss);
  useScrollLock();

  return (
    <motion.div
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="fixed inset-0 z-[200] flex flex-col bg-black/90 backdrop-blur-sm"
      onClick={dismiss}
    >
      {/* 상단 컨트롤바 */}
      <div
        className="shrink-0 flex items-center justify-between px-4 py-3 bg-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-bold text-white/80 truncate flex-1 mr-4">{title}</p>
        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            원본 보기
          </a>
          <button
            onClick={dismiss}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 플레이어 */}
      <div
        className="flex-1 flex items-center justify-center p-4 min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-5xl aspect-video">
          <iframe
            src={`https://chzzk.naver.com/embed/clip/${clipId}`}
            title={title}
            className="w-full h-full rounded-xl"
            allow="autoplay; clipboard-write; web-share"
            allowFullScreen
          />
        </div>
      </div>
    </motion.div>
  );
}
