'use client';

import { useMemo, useState } from 'react';
import { Plus, SquarePen } from 'lucide-react';
import CreateStreamerModal from '@/components/Form/CreateStreamerModal';

type StreamerItem = {
  id: string;
  name: string;
  handle: string;
  generation: number;
  role: string | null;
  platform: string;
  profileImg: string | null;
  colorCode: string;
  chzzkUrl: string | null;
  youtubeUrl: string | null;
  bio: string | null;
  isGuest: boolean;
};

export default function StreamerManagement({
  streamers,
}: {
  streamers: StreamerItem[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<StreamerItem | null>(null);

  const sorted = useMemo(
    () => [...streamers].sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    [streamers],
  );

  return (
    <div className="p-8 space-y-6 bg-white dark:bg-slate-950 transition-colors">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            방송인 관리
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-2">
            스트리머 정보를 생성/수정할 수 있습니다.
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          새 인원 추가
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map((streamer) => (
          <div
            key={streamer.id}
            className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: streamer.colorCode }}
                  />
                  <h3 className="text-lg font-black text-slate-800 dark:text-white truncate">
                    {streamer.name}
                  </h3>
                  {streamer.isGuest && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                      게스트
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  @{streamer.handle} · {streamer.generation}기{streamer.role ? ` · ${streamer.role}` : ''}
                </p>
              </div>

              <button
                onClick={() => setEditing(streamer)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0"
              >
                <SquarePen className="w-4 h-4" />
                수정
              </button>
            </div>

            {streamer.bio && (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                {streamer.bio}
              </p>
            )}
          </div>
        ))}
      </div>

      {createOpen && (
        <CreateStreamerModal
          onClose={() => setCreateOpen(false)}
          mode="create"
        />
      )}

      {editing && (
        <CreateStreamerModal
          onClose={() => setEditing(null)}
          mode="edit"
          initialData={editing}
        />
      )}
    </div>
  );
}
