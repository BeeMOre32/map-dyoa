'use client';

import { ExternalLink, Trash2, Play, Tv, Pencil } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import type { ClipWithParticipants } from '@/types/entities';
import { deleteClipAction } from '@/app/actions';
import { getStreamerColor } from '@/constants/streamercolor';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import { extractChzzkClipId } from '@/lib/chzzk';

interface ClipCardProps {
  clip: ClipWithParticipants;
  onEdit?: (clip: ClipWithParticipants) => void;
}

export default function ClipCard({ clip, onEdit }: ClipCardProps) {
  const { data: session } = useSession();
  const { resolvedTheme } = useTheme();
  const [deleting, setDeleting] = useState(false);
  const [iframeActive, setIframeActive] = useState(false);

  const chzzkClipId = extractChzzkClipId(clip.url);
  const useIframe = chzzkClipId !== null && !clip.thumbnailUrl;

  const formattedDate = clip.clipDate
    ? new Date(clip.clipDate).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('이 클립을 삭제하시겠습니까?')) return;
    setDeleting(true);
    await deleteClipAction(clip.id);
    setDeleting(false);
  }

  return (
    <div className="group flex flex-col rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-xl hover:shadow-indigo-50 dark:hover:shadow-indigo-950/50 transition-all">

      {/* ── 미디어 영역 ── */}
      <div className="relative aspect-video bg-black overflow-hidden">

        {/* 케이스 1: iframe 활성화된 상태 */}
        {useIframe && iframeActive && (
          <iframe
            src={`https://chzzk.naver.com/embed/clip/${chzzkClipId}`}
            title={clip.title}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; clipboard-write; web-share"
            allowFullScreen
          />
        )}

        {/* 케이스 2: 정적 썸네일 */}
        {clip.thumbnailUrl && !iframeActive && (
          <a href={clip.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0">
            <Image
              src={clip.thumbnailUrl}
              alt={clip.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              unoptimized
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-6 h-6 text-white fill-white ml-0.5" />
              </div>
            </div>
          </a>
        )}

        {/* 케이스 3: 치지직 클립이지만 iframe 비활성 → 클릭해서 활성화 */}
        {useIframe && !iframeActive && (
          <button
            onClick={() => setIframeActive(true)}
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-2 bg-[#0B0E13] group/play"
          >
            {/* 치지직 로고 색상 그라디언트 배경 */}
            <div className="absolute inset-0 bg-linear-to-br from-[#00FFA3]/10 to-transparent" />
            <div className="relative w-14 h-14 rounded-full bg-white/10 group-hover/play:bg-[#00FFA3]/20 border border-white/20 group-hover/play:border-[#00FFA3]/50 flex items-center justify-center transition-all duration-300">
              <Play className="w-7 h-7 text-white fill-white ml-1 group-hover/play:text-[#00FFA3] group-hover/play:fill-[#00FFA3] transition-colors" />
            </div>
            <span className="relative text-[11px] font-black text-white/60 group-hover/play:text-[#00FFA3] tracking-wider uppercase transition-colors">
              클릭해서 재생
            </span>
          </button>
        )}

        {/* 케이스 4: 썸네일도 없고 치지직도 아닌 경우 */}
        {!clip.thumbnailUrl && !useIframe && (
          <a
            href={clip.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800"
          >
            <Play className="w-12 h-12 text-slate-300 dark:text-slate-600" />
          </a>
        )}

        {/* iframe 활성 시 닫기 버튼 */}
        {iframeActive && (
          <button
            onClick={() => setIframeActive(false)}
            className="absolute top-2 right-2 z-10 px-2 py-1 bg-black/60 hover:bg-black/80 text-white text-[10px] font-black rounded-lg transition-colors"
          >
            닫기
          </button>
        )}
      </div>

      {/* ── 정보 영역 ── */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        {/* 제목 + 버튼 */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-black text-slate-800 dark:text-white text-sm leading-snug line-clamp-2 flex-1">
            {clip.title}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <a
              href={clip.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
              title="클립 열기"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            {session && (
              <>
                <button
                  onClick={() => onEdit?.(clip)}
                  className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                  title="클립 수정"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all disabled:opacity-50"
                  title="클립 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* 설명 */}
        {clip.description && (
          <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2">
            {clip.description}
          </p>
        )}

        {/* 연결된 방송 */}
        {clip.schedule && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
            <Tv className="w-3 h-3 text-indigo-500 dark:text-indigo-400 shrink-0" />
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 line-clamp-1">
              {clip.schedule.title}
            </span>
          </div>
        )}

        {/* 연관 스트리머 뱃지 */}
        <div className="flex flex-wrap gap-1 mt-auto pt-2">
          {clip.participants.map(({ streamer }) => {
            const color =
              getStreamerColor(streamer.id, resolvedTheme === 'dark') ??
              streamer.colorCode;
            return (
              <span
                key={streamer.id}
                className="px-2 py-0.5 text-white rounded-lg text-[10px] font-black shadow-sm"
                style={{ backgroundColor: color }}
              >
                {streamer.name}
              </span>
            );
          })}
          {formattedDate && (
            <span className="ml-auto text-[10px] font-bold text-slate-400 dark:text-slate-500 self-center">
              {formattedDate}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
