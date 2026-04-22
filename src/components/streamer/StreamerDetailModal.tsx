// src/components/Streamer/StreamerDetailModal.tsx
'use client';

import { motion } from 'framer-motion';
import {
  X,
  ExternalLink,
  CalendarDays,
  BarChart3,
  Gamepad2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { backdropVariants, smoothModalVariants } from '@/lib/modalVariants';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import StreamerAvatar from './StreamerAvatar';
import { getStreamerImagePath } from '@/lib/utils';

export default function StreamerDetailModal({ streamer }: any) {
  const router = useRouter();
  const imgSrc = getStreamerImagePath(streamer.name);

  useEscapeKey(() => router.back());

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={backdropVariants}
      className="fixed inset-0 z-100 flex items-center justify-center p-4 md:p-8 bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-xl"
      onClick={() => router.back()}
    >
      <motion.div
        variants={smoothModalVariants}
        // max-w-3xl로 시원시원한 크기 부여
        className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.15)] dark:shadow-slate-900/50 overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 프로필 배너 (가로 스크롤 카드 스타일 확장) */}
        <div className="p-10 border-b border-slate-100 dark:border-slate-700 shrink-0 relative flex gap-8 items-center bg-slate-50 dark:bg-slate-700/30">
          <button
            onClick={() => router.back()}
            className="absolute top-6 right-6 p-2.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-all shadow-sm border border-slate-100 dark:border-slate-600"
          >
            <X className="w-6 h-6" />
          </button>

          {/* 원형 아바타 (더 크게) */}
          <StreamerAvatar
            size="large"
            colorCode=""
            name={streamer.name}
            imgSrc={imgSrc}
          />

          {/* 이름 및 슬로건 */}
          <div className="flex-1 space-y-1.5">
            <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              {streamer.name}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-wide uppercase">
              지도동의 매력덩어리 스트리머입니다!
            </p>
            {/* 소셜 링크 */}
          </div>
        </div>

        {/* 메인 본체 (스크롤 가능) */}
        <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-800">
          {/* 스트리머 소개 섹션 */}
          <div className="space-y-4 px-2">
            <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: streamer.colorCode }}
              ></span>
              스트리머 소개
            </h4>
            <div className="bg-slate-50/50 dark:bg-slate-700/30 p-8 rounded-3xl border border-slate-100/50 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold leading-relaxed text-sm">
              <p>아직 준비중입니다.</p>
            </div>
          </div>

          {/* 최근 방송 이력 (플레이한 게임) */}
          <div className="space-y-4 px-2 pt-2">
            <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: streamer.colorCode }}
              ></span>
              최근 플레이한 게임
            </h4>
            {/* 가로 스크롤 게임 배지 리스트 */}
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar px-1">
              {['공사중', 'test'].map((game) => (
                <div
                  key={game}
                  className="flex-none flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600 text-slate-500 dark:text-slate-400 font-bold text-xs shadow-sm hover:border-slate-200 dark:hover:border-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all"
                >
                  <Gamepad2 className="w-4 h-4" />
                  {game}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 하단 닫기 버튼 */}
        <div className="p-8 bg-slate-50 dark:bg-slate-700 border-t border-slate-100 dark:border-slate-700 flex gap-3 shrink-0">
          <button
            className="flex-1 py-4 bg-white dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-2xl font-black border border-slate-200 dark:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-500 transition-all flex items-center justify-center gap-2"
            onClick={() => router.back()}
          >
            돌아가기
          </button>
          <a
            target={streamer.chzzkUrl ? '_blank' : '_self'}
            rel="noopener noreferrer"
            href={streamer.chzzkUrl || '#'}
            className="flex-1 py-4 bg-indigo-600 dark:bg-indigo-600 text-white dark:text-white rounded-2xl font-black hover:bg-indigo-700 dark:hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 flex items-center justify-center gap-2"
          >
            채널 방문 <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}
