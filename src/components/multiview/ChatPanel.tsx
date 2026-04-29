'use client';

import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import type { Streamer } from '@prisma/client';
import { getChatUrl, startPixelDrag } from './utils';

export function ChatPanel({
  streamers,
  chatStreamerId,
  onClose,
  onSwitch,
}: {
  streamers: Streamer[];
  chatStreamerId: string;
  onClose: () => void;
  onSwitch: (id: string) => void;
}) {
  const [width, setWidth] = useState(320);
  const chatStreamer = streamers.find((s) => s.id === chatStreamerId);
  if (!chatStreamer) return null;

  return (
    <div className="relative flex shrink-0" style={{ width }}>
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10 bg-slate-800 hover:bg-indigo-500/60 transition-colors"
        onMouseDown={(e) => startPixelDrag(e, (dx) => {
          setWidth(w => Math.max(200, Math.min(600, w - dx)));
        })}
      />
      <div className="flex-1 flex flex-col bg-slate-950 border-l border-slate-800 overflow-hidden pl-1">
        <div className="shrink-0 flex items-center gap-2 px-3 h-10 bg-slate-900 border-b border-slate-800">
          <MessageSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <select
            value={chatStreamerId}
            onChange={(e) => onSwitch(e.target.value)}
            className="flex-1 bg-transparent text-white text-xs font-black outline-none min-w-0 cursor-pointer"
          >
            {streamers.map((s) => (
              <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                {s.name}
              </option>
            ))}
          </select>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <iframe
          key={chatStreamerId}
          src={getChatUrl(chatStreamer)}
          className="flex-1 border-none"
          title={`${chatStreamer.name} 채팅`}
        />
      </div>
    </div>
  );
}
