'use client';

import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { getStreamerImagePath } from '@/src/lib/utils';
import StreamerAvatar from './StreamerAvatar';

interface Streamer {
  id: string;
  name: string;
  handle?: string;
  generation: string;
  role?: string;
  platform?: string;
  colorCode: string;
}

interface StreamerCardProps {
  streamer: Streamer;
  onRequestEdit: (streamer: Streamer) => void;
}

export default function StreamerCard({
  streamer,
  onRequestEdit,
}: StreamerCardProps) {
  const imgSrc = getStreamerImagePath(streamer.name);

  return (
    <Link
      key={streamer.id}
      href={`/streamers/detail/${streamer.id}`}
      scroll={false} // 모달 뜰 때 스크롤 위치 유지
      className="group flex flex-col p-5 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all bg-white cursor-pointer relative"
    >
      <div className="flex justify-between items-start mb-4">
        <StreamerAvatar
          name={streamer.name}
          imgSrc={imgSrc}
          colorCode={streamer.colorCode}
        />
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRequestEdit(streamer); // 수정 요청 타겟 지정
          }}
          className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
          {streamer.name}
        </h3>
        <p className="text-sm text-slate-400 font-bold">
          @{streamer.handle || 'nickname'}
        </p>
      </div>

      <div className="flex gap-2 mt-6">
        <span className="px-2.5 py-1 bg-slate-50 rounded-xl text-[10px] font-black text-slate-500 border border-slate-100 uppercase tracking-tighter">
          {streamer.generation}기
        </span>
        {streamer.role && (
          <span className="px-2.5 py-1 bg-indigo-50 rounded-xl text-[10px] font-black text-indigo-600 border border-indigo-100 uppercase tracking-tighter">
            {streamer.role}
          </span>
        )}
        <span
          className="px-2.5 py-1 text-white rounded-xl text-[10px] font-black ml-auto shadow-sm"
          style={{ backgroundColor: streamer.colorCode }}
        >
          {streamer.platform || 'CHZZK'}
        </span>
      </div>
    </Link>
  );
}
