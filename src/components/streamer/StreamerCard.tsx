'use client';

import { MoreHorizontal, LayoutGrid, Check } from 'lucide-react';
import Link from 'next/link';
import { Streamer } from '@prisma/client';
import { useTheme } from 'next-themes';
import { getStreamerImagePath } from '@/lib/utils';
import { getStreamerColor } from '@/constants/streamercolor';
import StreamerAvatar from './StreamerAvatar';
import { track } from '@vercel/analytics';

interface StreamerCardProps {
  streamer: Streamer;
  onRequestEdit: (streamer: Streamer) => void;
  isLive?: boolean;
  isSelected?: boolean;
  isMaxReached?: boolean;
  onToggleMultiview?: () => void;
}

export default function StreamerCard({
  streamer,
  onRequestEdit,
  isLive = false,
  isSelected = false,
  isMaxReached = false,
  onToggleMultiview,
}: StreamerCardProps) {
  const imgSrc = getStreamerImagePath(streamer.name);
  const { resolvedTheme } = useTheme();
  const streamerColor = getStreamerColor(streamer.id, resolvedTheme === 'dark') ?? streamer.colorCode;

  const canSelect = isSelected || !isMaxReached;

  return (
    <Link
      href={`/streamers/detail/${streamer.id}`}
      scroll={false}
      className={`group flex flex-col p-5 rounded-3xl border-2 transition-all bg-white dark:bg-slate-900 cursor-pointer relative ${
        isSelected
          ? 'border-indigo-500 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/30'
          : isLive
            ? 'border-red-200 dark:border-red-900/60 shadow-[0_4px_24px_rgba(239,68,68,0.15)] dark:shadow-[0_4px_24px_rgba(239,68,68,0.10)] hover:border-red-300 dark:hover:border-red-800'
            : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-xl hover:shadow-indigo-50 dark:hover:shadow-indigo-950/50'
      }`}
    >
      {/* 라이브 중 상단 강조선 */}
      {isLive && !isSelected && (
        <div className="absolute top-0 left-5 right-5 h-0.5 rounded-full bg-linear-to-r from-transparent via-red-400 to-transparent" />
      )}

      {/* 선택 중 상단 강조선 */}
      {isSelected && (
        <div className="absolute top-0 left-5 right-5 h-0.5 rounded-full bg-linear-to-r from-transparent via-indigo-500 to-transparent" />
      )}

      <div className="flex justify-between items-start mb-4">
        {/* 아바타 + LIVE 배지 */}
        <div className="relative">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden">
            <StreamerAvatar
              name={streamer.name}
              imgSrc={imgSrc}
              colorCode={streamerColor}
              streamerId={streamer.id}
              size="medium"
            />
          </div>
          {isLive && (
            <span className="absolute -bottom-1 -right-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black leading-none shadow-md">
              <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
              LIVE
            </span>
          )}
        </div>

        {/* 우상단 버튼 그룹 */}
        <div className="flex items-center gap-1">
          {/* 멀티뷰 토글 버튼 */}
          <button
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
              onToggleMultiview?.();
            }}
            title={isSelected ? '멀티뷰에서 제거' : '멀티뷰에 추가'}
            className={`p-1.5 rounded-lg transition-all ${
              isSelected
                ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                : canSelect
                  ? 'text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                  : 'text-slate-200 dark:text-slate-700 cursor-not-allowed'
            }`}
          >
            {isSelected
              ? <Check className="w-4 h-4" />
              : <LayoutGrid className="w-4 h-4" />
            }
          </button>

          {/* 더보기 버튼 */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRequestEdit(streamer);
            }}
            className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <h3 className={`text-lg font-black transition-colors ${
          isSelected
            ? 'text-indigo-600 dark:text-indigo-400'
            : isLive
              ? 'text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300'
              : 'text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
        }`}>
          {streamer.name}
        </h3>
        <p className="text-sm text-slate-400 dark:text-slate-500 font-bold">
          @{streamer.handle || 'nickname'}
        </p>
      </div>

      <div className="flex gap-2 mt-6">
        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-xl text-[10px] font-black text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 uppercase tracking-tighter">
          {streamer.generation}기
        </span>
        {streamer.role && (
          <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-[10px] font-black text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 uppercase tracking-tighter">
            {streamer.role}
          </span>
        )}
        <span
          className="px-2.5 py-1 text-white rounded-xl text-[10px] font-black ml-auto shadow-sm"
          style={{ backgroundColor: streamerColor }}
        >
          {streamer.platform || 'CHZZK'}
        </span>
      </div>
    </Link>
  );
}
