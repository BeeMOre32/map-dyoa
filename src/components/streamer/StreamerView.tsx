// src/components/streamer/StreamerView.tsx
'use client';

import { AnimatePresence } from 'framer-motion';
import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import RequestEditModal from '../Form/RequestEdit';

export default function StreamerView({ streamers }: { streamers: any[] }) {
  const [requestTarget, setRequestTarget] = useState<any>(null);
  return (
    <div className="h-full flex flex-col bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
      {/* 헤더 */}
      <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30 shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-800">
            참여 방송인 목록
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            총 {streamers.length}명의 방송인이 지도동과 함께합니다.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {streamers.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
            <p className="text-slate-400 font-bold">
              아직 등록된 방송인이 없습니다.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {streamers.map((streamer) => (
              <Link
                key={streamer.id}
                href={`/streamers/detail/${streamer.id}`}
                scroll={false} // 모달 뜰 때 스크롤 위치 유지
                className="group flex flex-col p-5 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all bg-white cursor-pointer relative"
              >
                <div className="flex justify-between items-start mb-4">
                  {/* 아바타 (두 글자 표시로 변경하면 더 예뻐요) */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm transition-transform group-hover:scale-110 duration-300"
                    style={{
                      backgroundColor: `${streamer.colorCode}20`,
                      color: streamer.colorCode,
                    }}
                  >
                    {streamer.name.substring(0, 2)}
                  </div>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setRequestTarget(streamer); // 수정 요청 타겟 지정
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
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {requestTarget && (
          <RequestEditModal
            streamer={requestTarget}
            onClose={() => setRequestTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
