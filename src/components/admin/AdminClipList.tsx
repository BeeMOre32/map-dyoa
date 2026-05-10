'use client';

import { useState, useTransition } from 'react';
import { Trash2, Film, ExternalLink, Check, X, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { deleteClipAction } from '@/app/actions';
import { useRouter } from 'next/navigation';

type ClipItem = {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string | null;
  createdAt: Date;
  participants: { streamer: { id: string; name: string; colorCode: string } }[];
};

function DeleteClipButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (confirm) {
    return (
      <div className="flex gap-1">
        <button
          onClick={() => startTransition(async () => {
            await deleteClipAction(id);
            router.refresh();
          })}
          disabled={isPending}
          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
        </button>
        <button onClick={() => setConfirm(false)} className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-xl">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors bg-slate-100 dark:bg-slate-700 rounded-xl"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

export default function AdminClipList({ clips }: { clips: ClipItem[] }) {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? clips.filter(
        (c) =>
          c.title.includes(search) ||
          c.participants.some((p) => p.streamer.name.includes(search)),
      )
    : clips;

  return (
    <div className="p-8 space-y-6 bg-white dark:bg-slate-950 transition-colors">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">클립 관리</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-2">
            전체 클립 {clips.length}개
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="클립 제목 또는 스트리머 이름으로 검색..."
          className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700"
        />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 dark:text-slate-500">
            <Film className="w-10 h-10 opacity-40" />
            <p className="font-bold text-sm">클립이 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {filtered.map((clip) => (
              <div key={clip.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-20 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0">
                  {clip.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={clip.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate text-sm">{clip.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {clip.participants.map((p) => (
                      <span
                        key={p.streamer.id}
                        className="text-[11px] font-bold px-2 py-0.5 rounded-lg"
                        style={{ backgroundColor: `${p.streamer.colorCode}20`, color: p.streamer.colorCode }}
                      >
                        {p.streamer.name}
                      </span>
                    ))}
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                      {format(new Date(clip.createdAt), 'yyyy.MM.dd', { locale: ko })}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <a
                    href={clip.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors bg-slate-100 dark:bg-slate-700 rounded-xl"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <DeleteClipButton id={clip.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
