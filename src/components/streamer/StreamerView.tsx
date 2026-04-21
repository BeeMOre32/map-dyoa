// src/components/streamer/StreamerView.tsx
'use client';

import { AnimatePresence } from 'framer-motion';
import { useCallback, useState } from 'react';
import { Streamer } from '@prisma/client';
import RequestEditModal from '../Form/RequestEdit';
import StreamerCard from './StreamerCard';

export default function StreamerView({ streamers }: { streamers: Streamer[] }) {
  const [requestTarget, setRequestTarget] = useState<Streamer | null>(null);

  const handleRequestEdit = useCallback((streamer: Streamer) => {
    setRequestTarget(streamer);
  }, []);

  const handleClose = useCallback(() => {
    setRequestTarget(null);
  }, []);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800 relative overflow-hidden">
      {/* 헤더 */}
      <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/20 shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">
            참여 방송인 목록
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            총 {streamers.length}명의 방송인이 지도동과 함께합니다.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {streamers.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-3xl">
            <p className="text-slate-400 dark:text-slate-500 font-bold">
              아직 등록된 방송인이 없습니다.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {streamers.map((streamer) => (
              <StreamerCard
                key={streamer.id}
                streamer={streamer}
                onRequestEdit={handleRequestEdit}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {requestTarget && (
          <RequestEditModal streamer={requestTarget} onClose={handleClose} />
        )}
      </AnimatePresence>
    </div>
  );
}
