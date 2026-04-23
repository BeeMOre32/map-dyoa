'use client';

import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { Streamer } from '@prisma/client';
import { useTheme } from 'next-themes';
import { getStreamerImagePath } from '@/lib/utils';
import { getStreamerColor } from '@/constants/streamercolor';
import StreamerAvatar from './StreamerAvatar';

interface StreamerCardProps {
  streamer: Streamer;
  onRequestEdit: (streamer: Streamer) => void;
}

export default function StreamerCard({
  streamer,
  onRequestEdit,
}: StreamerCardProps) {
  const imgSrc = getStreamerImagePath(streamer.name);
  const { resolvedTheme } = useTheme();
  const streamerColor = getStreamerColor(streamer.id, resolvedTheme === 'dark') ?? streamer.colorCode;

  return (
    <Link
      key={streamer.id}
      href={`/streamers/detail/${streamer.id}`}
      scroll={false} // 모달 뜰 때 스크롤 위치 유지
      className="group flex flex-col p-5 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-xl hover:shadow-indigo-50 dark:hover:shadow-indigo-950/50 transition-all bg-white dark:bg-slate-900 cursor-pointer relative"
    >
      <div className="flex justify-between items-start mb-4">
        <StreamerAvatar
          name={streamer.name}
          imgSrc={imgSrc}
          colorCode={streamerColor}
          streamerId={streamer.id}
          size="medium"
        />
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRequestEdit(streamer);
          }}
          className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-black text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
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
