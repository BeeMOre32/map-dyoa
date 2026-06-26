'use client';

import { useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  GripVertical,
  Maximize2,
  MessageSquare,
  Minimize2,
  PanelRight,
  PlayCircle,
  Volume2,
  VolumeX,
  Headphones,
  X,
} from 'lucide-react';
import { useTheme } from '@teispace/next-themes';
import { getStreamerColor } from '@/constants/streamercolor';
import type { Streamer } from '@prisma/client';
import StreamerAvatar from '@/components/streamer/StreamerAvatar';
import { getLiveUrl, postToChzzkIframe } from './utils';

const overlayHoverClass =
  'opacity-0 invisible pointer-events-none transition-opacity duration-200 [@media(hover:hover)]:group-hover/panel:opacity-100 [@media(hover:hover)]:group-hover/panel:visible';

const overlayPinnedClass = 'opacity-100 visible';

const controlBtnClass =
  'pointer-events-auto p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/70 transition-all shadow-sm disabled:opacity-20 disabled:cursor-not-allowed';

interface StreamPanelProps {
  streamer: Streamer;
  isLoaded: boolean;
  isFocused: boolean;
  isMuted: boolean;
  isLive: boolean;
  pinControls: boolean;
  canLeft: boolean;
  canRight: boolean;
  onLoad: () => void;
  onHide: () => void;
  onToggleFocus: () => void;
  onSwapLeft: () => void;
  onSwapRight: () => void;
  onToggleMute: () => void;
  onSoloAudio: () => void;
  onOpenChat: () => void;
  onDragReorder: (targetId: string) => void;
}

export function StreamPanel({
  streamer,
  isLoaded,
  isFocused,
  isMuted,
  isLive,
  pinControls,
  canLeft,
  canRight,
  onLoad,
  onHide,
  onToggleFocus,
  onSwapLeft,
  onSwapRight,
  onToggleMute,
  onSoloAudio,
  onOpenChat,
  onDragReorder,
}: StreamPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { resolvedTheme } = useTheme();
  const color = getStreamerColor(streamer.id, resolvedTheme === 'dark') ?? streamer.colorCode;
  const liveUrl = getLiveUrl(streamer);

  const overlayClass = pinControls ? overlayPinnedClass : overlayHoverClass;

  useEffect(() => {
    if (!isLoaded) return;
    postToChzzkIframe(iframeRef.current, 'toggle-mute', { muted: isMuted });
  }, [isMuted, isLoaded]);

  const toggleEmbeddedChat = () => {
    postToChzzkIframe(iframeRef.current, 'toggle-chat');
  };

  const applyMute = () => {
    onToggleMute();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', streamer.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const fromId = e.dataTransfer.getData('text/plain');
    if (fromId && fromId !== streamer.id) onDragReorder(fromId);
  };

  return (
    <div
      className="relative bg-slate-950 overflow-hidden group/panel h-full"
      onDoubleClick={onToggleFocus}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
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
            <motion.div
              className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg overflow-hidden"
              style={{ boxShadow: `0 8px 32px ${color}50` }}
            >
              <StreamerAvatar
                name={streamer.name}
                imgSrc={streamer.profileImg}
                colorCode={color}
                streamerId={streamer.id}
                size="large"
              />
            </motion.div>
            <p className="text-white font-black text-base">{streamer.name}</p>
            {!isLive && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                오프라인
              </span>
            )}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
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
          ref={iframeRef}
          src={liveUrl}
          className="w-full h-full border-none"
          allow="autoplay; fullscreen; picture-in-picture"
          title={streamer.name}
        />
      )}

      {/* 데스크톱: 상단 컨트롤 */}
      {isLoaded && (
      <div
        className={`absolute top-0 left-0 right-0 flex items-start justify-between p-2 gap-2 ${overlayClass} [@media(hover:none)]:hidden`}
      >
        <div className="flex gap-1">
          <button
            type="button"
            draggable
            onDragStart={handleDragStart}
            className={`${controlBtnClass} cursor-grab active:cursor-grabbing`}
            title="드래그하여 순서 변경"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onSwapLeft}
            disabled={!canLeft}
            className={controlBtnClass}
            title="왼쪽으로"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onSwapRight}
            disabled={!canRight}
            className={controlBtnClass}
            title="오른쪽으로"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-1">
          <button
            type="button"
            onClick={onToggleFocus}
            className={controlBtnClass}
            title={isFocused ? '그리드로 (Esc)' : '크게 보기 (더블클릭)'}
          >
            {isFocused ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={applyMute}
            className={`${controlBtnClass} ${isMuted ? 'text-amber-300' : ''}`}
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onSoloAudio}
            className={controlBtnClass}
            title="이 패널만 소리"
          >
            <Headphones className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleEmbeddedChat}
            className={controlBtnClass}
            title="치지직 내장 채팅 접기/펼치기"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onOpenChat}
            className={controlBtnClass}
            title="오른쪽 채팅 패널 열기"
          >
            <PanelRight className="w-4 h-4" />
          </button>
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={controlBtnClass}
            title="새 탭으로 열기"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button type="button" onClick={onHide} className={controlBtnClass} title="패널 숨기기">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      )}

      {/* 모바일: 하단 컨트롤 바 */}
      {isLoaded && (
      <div
        className={`absolute bottom-0 left-0 right-0 flex items-center justify-between gap-1 p-1.5 bg-black/70 backdrop-blur-sm [@media(hover:hover)]:hidden ${
          pinControls ? '' : 'opacity-90'
        }`}
      >
        <div className="flex items-center gap-1 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-white text-[10px] font-black truncate">{streamer.name}</span>
          {!isLive && (
            <span className="text-[9px] font-black px-1 py-0.5 rounded bg-slate-700 text-slate-400 shrink-0">
              OFF
            </span>
          )}
        </div>
        <div className="flex gap-0.5 shrink-0">
          <button type="button" onClick={onToggleFocus} className={controlBtnClass}>
            {isFocused ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button type="button" onClick={applyMute} className={controlBtnClass}>
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button type="button" onClick={onOpenChat} className={controlBtnClass}>
            <PanelRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      )}

      {/* 데스크톱: 이름 뱃지 */}
      {isLoaded && (
      <div
        className={`absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg ${overlayClass} [@media(hover:none)]:hidden`}
      >
        <span className="pointer-events-none w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="pointer-events-none text-white text-[10px] font-black">{streamer.name}</span>
        {!isLive && (
          <span className="pointer-events-none text-[9px] font-black px-1 py-0.5 rounded bg-slate-700 text-slate-400">
            OFF
          </span>
        )}
      </div>
      )}
    </div>
  );
}
