'use client';

import { MoreHorizontal, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { Streamer } from '@prisma/client';
import { getStreamerImagePath } from '@/lib/utils';
import { useIsDarkAfterMount } from '@/hooks/useIsDarkAfterMount';
import { getStreamerColor } from '@/constants/streamercolor';
import { getChannelUrl } from '@/components/multiview/utils';
import StreamerAvatar from './StreamerAvatar';
import { track } from '@vercel/analytics';
import { markModalSoftNav } from '@/lib/modal-navigation';

interface StreamerCardProps {
  streamer: Streamer;
  onRequestEdit: (streamer: Streamer) => void;
  isLive?: boolean;
  isSelected?: boolean;
  isMaxReached?: boolean;
  onToggleMultiview?: () => void;
  selectionIndex?: number;
}

export default function StreamerCard({
  streamer,
  onRequestEdit,
  isLive = false,
  isSelected = false,
  isMaxReached = false,
  onToggleMultiview,
  selectionIndex,
}: StreamerCardProps) {
  const imgSrc = streamer.profileImg ?? getStreamerImagePath(streamer.name);
  const isDark = useIsDarkAfterMount();
  const streamerColor = getStreamerColor(streamer.id, isDark) ?? streamer.colorCode;
  const channelUrl = getChannelUrl(streamer);
  const canSelect = isSelected || !isMaxReached;

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
    <Link
      href={`/streamers/detail/${streamer.id}`}
      scroll={false}
      onClick={() => markModalSoftNav()}
      className={`group relative flex cursor-pointer flex-col rounded-2xl border-2 bg-white p-3.5 transition-all dark:bg-slate-900 sm:rounded-3xl sm:p-5 ${borderCls}`}
    >
      {isLive && !isSelected && (
        <div className="absolute top-0 left-3.5 right-3.5 h-0.5 rounded-full bg-linear-to-r from-transparent via-red-400 to-transparent sm:left-5 sm:right-5" />
      )}
      {isSelected && (
        <div className="absolute top-0 left-3.5 right-3.5 h-0.5 rounded-full bg-linear-to-r from-transparent via-indigo-500 to-transparent sm:left-5 sm:right-5" />
      )}

      <div className="mb-2.5 flex items-start justify-between sm:mb-4">
        <div className="relative">
          <div className="relative h-11 w-11 overflow-hidden rounded-xl sm:h-14 sm:w-14 sm:rounded-2xl">
            <StreamerAvatar
              name={streamer.name}
              imgSrc={imgSrc}
              colorCode={streamerColor}
              streamerId={streamer.id}
              size="medium"
            />
          </div>
          {isLive && (
            <span className="absolute -bottom-0.5 -right-0.5 flex items-center gap-0.5 rounded-full bg-red-500 px-1 py-px text-[8px] font-black leading-none text-white shadow-md sm:-bottom-1 sm:-right-1 sm:px-1.5 sm:py-0.5 sm:text-[9px]">
              <span className="h-0.5 w-0.5 animate-pulse rounded-full bg-white sm:h-1 sm:w-1" />
              LIVE
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRequestEdit(streamer);
          }}
          className="rounded-lg p-1 text-slate-300 transition-all hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 sm:p-1.5"
        >
          <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>

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

        <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
          {/* 치지직 채널 바로가기 */}
          <button
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
              {isSelected && selectionIndex != null
                ? selectionIndex
                : <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              }
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
