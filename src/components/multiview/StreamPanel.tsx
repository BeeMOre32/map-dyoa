'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, ExternalLink, Maximize2, MessageSquare,
  Minimize2, PlayCircle, X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { getStreamerColor } from '@/constants/streamercolor';
import type { Streamer } from '@prisma/client';
import { getLiveUrl } from './utils';

interface StreamPanelProps {
  streamer: Streamer;
  isLoaded: boolean;
  isFocused: boolean;
  canLeft: boolean;
  canRight: boolean;
  onLoad: () => void;
  onHide: () => void;
  onToggleFocus: () => void;
  onSwapLeft: () => void;
  onSwapRight: () => void;
  onOpenChat: () => void;
}

export function StreamPanel({
  streamer, isLoaded, isFocused, canLeft, canRight,
  onLoad, onHide, onToggleFocus, onSwapLeft, onSwapRight, onOpenChat,
}: StreamPanelProps) {
  const { resolvedTheme } = useTheme();
  const color = getStreamerColor(streamer.id, resolvedTheme === 'dark') ?? streamer.colorCode;
  const liveUrl = getLiveUrl(streamer);

  return (
    <div className="relative bg-slate-950 overflow-hidden group/panel h-full">
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer"
            style={{ background: `linear-gradient(135deg, ${color}22, ${color}0a)` }}
            onClick={onLoad}
          >
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-black text-white shadow-lg"
              style={{ backgroundColor: color, boxShadow: `0 8px 32px ${color}50` }}
            >
              {streamer.name[0]}
            </div>
            <p className="text-white font-black text-base">{streamer.name}</p>
            <motion.div
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white text-sm font-black shadow-md"
              style={{ backgroundColor: color }}
            >
              <PlayCircle className="w-4 h-4" />
              시청 시작
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoaded && (
        <iframe
          src={liveUrl}
          className="w-full h-full border-none"
          allow="autoplay; fullscreen; picture-in-picture"
          title={streamer.name}
        />
      )}

      <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-2 gap-2 pointer-events-none">
        <div className="flex gap-1 pointer-events-auto">
          <button onClick={onSwapLeft} disabled={!canLeft}
            className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/70 transition-all shadow-sm disabled:opacity-20 disabled:cursor-not-allowed"
            title="왼쪽으로">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={onSwapRight} disabled={!canRight}
            className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/70 transition-all shadow-sm disabled:opacity-20 disabled:cursor-not-allowed"
            title="오른쪽으로">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-1 pointer-events-auto">
          <button onClick={onToggleFocus}
            className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/70 transition-all shadow-sm"
            title={isFocused ? '원래 크기로' : '크게 보기'}>
            {isFocused ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={onOpenChat}
            className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/70 transition-all shadow-sm"
            title="채팅 열기">
            <MessageSquare className="w-4 h-4" />
          </button>
          <a href={liveUrl} target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/70 transition-all shadow-sm"
            title="새 탭으로 열기">
            <ExternalLink className="w-4 h-4" />
          </a>
          <button onClick={onHide}
            className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white/60 hover:text-white hover:bg-red-500/60 transition-all shadow-sm"
            title="패널 숨기기">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-white text-[10px] font-black">{streamer.name}</span>
      </div>
    </div>
  );
}
