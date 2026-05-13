'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Calendar, ChevronLeft, ChevronRight, ExternalLink,
  Clapperboard, ArrowUpRight, Plus, Sword,
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getStreamerColor } from '@/constants/streamercolor';
import type { ParticipantFlat } from '@/lib/schedule-formatters';

export type ClipForSchedule = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  clipDate: Date | string | null;
  participants: { streamer: { id: string; name: string; colorCode: string } }[];
};

export type SideTab = 'clips' | 'hoi4';

const RESULT_LABEL: Record<string, string> = { WIN: '승', LOSE: '패', DNF: '미완' };
const RESULT_STYLE: Record<string, string> = {
  WIN: 'bg-emerald-500 text-white',
  LOSE: 'bg-red-500 text-white',
  DNF: 'bg-slate-400 text-white',
};

function Hoi4Panel({ participants, isDark }: { participants: ParticipantFlat[]; isDark: boolean }) {
  const hasData = participants.some((p) => p.nation || p.result);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain custom-scrollbar p-3">
      {hasData ? (
        <div className="space-y-1.5">
          {participants.map((p) => {
            const color = getStreamerColor(p.id, isDark) ?? p.colorCode;
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50"
              >
                <span className="text-sm font-black w-20 shrink-0 truncate" style={{ color }}>
                  {p.name}
                </span>
                <span className="flex-1 text-sm font-bold text-slate-600 dark:text-slate-300 truncate">
                  {p.nation || <span className="text-slate-300 dark:text-slate-600">—</span>}
                </span>
                {p.result ? (
                  <span className={`text-[11px] font-black px-2.5 py-1 rounded-full shrink-0 ${RESULT_STYLE[p.result] ?? 'bg-slate-400 text-white'}`}>
                    {RESULT_LABEL[p.result] ?? p.result}
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500">
                    미등록
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-4 py-8 px-4 text-center">
          <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-700/50">
            <Sword className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-black text-slate-500 dark:text-slate-400">아직 전적이 없어요</p>
            <p className="text-xs font-bold text-slate-300 dark:text-slate-600">일정 수정에서 국가/결과를 입력하세요</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ClipPanel({
  clips,
  selectedClip,
  onSelect,
  isDark,
}: {
  clips: ClipForSchedule[];
  selectedClip: ClipForSchedule | null;
  onSelect: (clip: ClipForSchedule | null) => void;
  isDark: boolean;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AnimatePresence mode="wait">
      {selectedClip ? (
        <motion.div
          key="detail"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="flex-1 min-h-0 flex flex-col"
        >
          <div className="flex-1 min-h-0 p-5 space-y-4 overflow-y-auto overscroll-y-contain custom-scrollbar">
            <button
              onClick={() => onSelect(null)}
              className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              목록으로
            </button>
            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug">{selectedClip.title}</h3>
            {selectedClip.participants.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedClip.participants.map((p) => {
                  const color = getStreamerColor(p.streamer.id, isDark) ?? p.streamer.colorCode;
                  return (
                    <span
                      key={p.streamer.id}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={{ color, backgroundColor: `${color}18` }}
                    >
                      {p.streamer.name}
                    </span>
                  );
                })}
              </div>
            )}
            {selectedClip.clipDate && (
              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-bold">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(selectedClip.clipDate), 'yyyy년 M월 d일', { locale: ko })}
              </div>
            )}
            {selectedClip.description && (
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-700/50 rounded-2xl px-4 py-3.5">
                {selectedClip.description}
              </p>
            )}
          </div>
          <div className="p-5 border-t border-slate-100 dark:border-slate-700 shrink-0">
            <a
              href={selectedClip.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm transition-all active:scale-95 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30"
            >
              클립 보러가기
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="list"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain custom-scrollbar p-3 space-y-1.5"
        >
          {clips.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-5 py-8 px-4 text-center">
              <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-700/50">
                <Clapperboard className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-black text-slate-500 dark:text-slate-400">아직 등록된 클립이 없어요</p>
                <p className="text-xs font-bold text-slate-300 dark:text-slate-600">많은 이용 부탁드립니다 :)</p>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <a
                  href="/clips"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-black transition-all hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                >
                  클립 모음 보러가기
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
                <a
                  href="/clips"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  클립 직접 추가하기
                </a>
              </div>
            </div>
          ) : (
            clips.map((clip) => (
              <button
                key={clip.id}
                onClick={() => onSelect(clip)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-700 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 text-left transition-all group"
              >
                <Clapperboard className="w-4 h-4 shrink-0 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {clip.title}
                  </p>
                  {clip.participants.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {clip.participants.map((p) => {
                        const color = getStreamerColor(p.streamer.id, isDark) ?? p.streamer.colorCode;
                        return (
                          <span
                            key={p.streamer.id}
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ color, backgroundColor: `${color}18` }}
                          >
                            {p.streamer.name}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 shrink-0 text-slate-200 dark:text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))
          )}
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
}

export function SidePanel({
  clips,
  participants,
  isHoi4,
  isDark,
  onClose,
  defaultTab,
}: {
  clips: ClipForSchedule[];
  participants: ParticipantFlat[];
  isHoi4: boolean;
  isDark: boolean;
  onClose?: () => void;
  defaultTab?: SideTab;
}) {
  const [tab, setTab] = useState<SideTab>(defaultTab ?? 'clips');
  const [selectedClip, setSelectedClip] = useState<ClipForSchedule | null>(null);

  const tabClass = (active: boolean, accent: string) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs font-black transition-colors ${
      active
        ? `bg-white dark:bg-slate-800 ${accent} border border-b-white dark:border-slate-700 dark:border-b-slate-800 -mb-px`
        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
    }`;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30">
        <div className="flex items-center px-2 pt-2 gap-1">
          <button
            onClick={() => { setTab('clips'); setSelectedClip(null); }}
            className={tabClass(tab === 'clips', 'text-indigo-600 dark:text-indigo-400')}
          >
            <Clapperboard className="w-3.5 h-3.5" />
            클립
            {clips.length > 0 && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none ${tab === 'clips' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400'}`}>
                {clips.length}
              </span>
            )}
          </button>
          {isHoi4 && (
            <button
              onClick={() => { setTab('hoi4'); setSelectedClip(null); }}
              className={tabClass(tab === 'hoi4', 'text-amber-600 dark:text-amber-400')}
            >
              <Sword className="w-3.5 h-3.5" />
              전적
            </button>
          )}
          <div className="flex-1" />
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 mb-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-slate-400 dark:text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            {tab === 'clips' ? (
              <ClipPanel clips={clips} selectedClip={selectedClip} onSelect={setSelectedClip} isDark={isDark} />
            ) : (
              <Hoi4Panel participants={participants} isDark={isDark} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
