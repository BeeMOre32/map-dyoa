'use client';

import { X, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { smoothModalVariants } from '@/lib/modalVariants';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import { useScrollLock } from '@/hooks/useScrollLock';
import { backdropVariants } from '@/lib/modalVariants';
import { ClipRecommendButton } from './ClipRecommendButton';

interface ClipPlayerModalProps {
  url: string;
  embedId: string | null;
  clipId: string;
  title: string;
  recommends?: number;
  onClose: () => void;
}

export function ClipPlayerModal({
  url,
  embedId,
  clipId,
  title,
  recommends = 0,
  onClose,
}: ClipPlayerModalProps) {
  const dismiss = useModalDismiss({ mother: '/clips', onClose });
  useEscapeKey(dismiss);
  useScrollLock();

  const keepOpen = (event: React.MouseEvent) => event.stopPropagation();

  return (
    <motion.div
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="fixed inset-0 z-[200] flex flex-col bg-black/95"
      onClick={dismiss}
    >
      <div
        className="flex shrink-0 items-center gap-3 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 sm:px-4"
        onClick={keepOpen}
      >
        <p className="min-w-0 flex-1 truncate text-sm font-bold text-white">{title}</p>
        <button
          onClick={dismiss}
          className="rounded-lg bg-white/10 p-1.5 text-white transition-colors hover:bg-white/20"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <motion.div
        variants={smoothModalVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="flex min-h-0 flex-1 flex-col px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5"
      >
        <div className="flex min-h-0 flex-1 items-center justify-center [container-type:size]">
          <div
            className="aspect-video w-[min(100cqw,calc(100cqh*16/9))] max-w-6xl overflow-hidden rounded-lg bg-black shadow-2xl sm:rounded-xl"
            onClick={keepOpen}
          >
            {embedId ? (
              <iframe
                src={`https://chzzk.naver.com/embed/clip/${embedId}`}
                title={title}
                className="h-full w-full"
                allow="autoplay; clipboard-write; web-share"
                allowFullScreen
              />
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm font-bold text-white/70">
                이 클립은 이 화면에서 재생되지 않습니다. 원본에서 볼 수 있습니다.
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 pt-3" onClick={keepOpen}>
          <ClipRecommendButton clipId={clipId} recommends={recommends} />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-sm font-bold text-white transition-colors hover:bg-white/20"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            원본 보기
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}
