// src/components/Streamer/StreamerDetailModal.tsx
'use client';

import { motion, Variants } from 'framer-motion';
import {
  X,
  ExternalLink,
  CalendarDays,
  BarChart3,
  Gamepad2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 50 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', damping: 30, stiffness: 250 },
  },
};

export default function StreamerDetailModal({ streamer }: any) {
  const router = useRouter();
  const avatarLetters = streamer.name.slice(0, 2); // 닉네임 앞 두 글자

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={backdropVariants}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-950/70 backdrop-blur-xl"
      onClick={() => router.back()}
    >
      <motion.div
        variants={modalVariants}
        // max-w-3xl로 시원시원한 크기 부여
        className="bg-white w-full max-w-3xl rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 프로필 배너 (가로 스크롤 카드 스타일 확장) */}
        <div className="p-10 border-b border-slate-100 shrink-0 relative flex gap-8 items-center bg-slate-50">
          <button
            onClick={() => router.back()}
            className="absolute top-6 right-6 p-2.5 bg-white hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all shadow-sm border border-slate-100"
          >
            <X className="w-6 h-6" />
          </button>

          {/* 원형 아바타 (더 크게) */}
          <div
            className="w-32 h-32 rounded-full flex items-center justify-center text-5xl font-black border-4 border-white shadow-xl flex-none"
            style={{ backgroundColor: streamer.colorCode, color: '#fff' }}
          >
            {avatarLetters}
          </div>

          {/* 이름 및 슬로건 */}
          <div className="flex-1 space-y-1.5">
            <h2 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">
              {streamer.name}
            </h2>
            <p className="text-slate-500 font-bold text-sm tracking-wide uppercase">
              지도동의 매력덩어리 스트리머입니다!
            </p>
            {/* 소셜 링크 */}
          </div>
        </div>

        {/* 메인 본체 (스크롤 가능) */}
        <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar flex-1">
          {/* 스트리머 소개 섹션 */}
          <div className="space-y-4 px-2">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: streamer.colorCode }}
              ></span>
              스트리머 소개
            </h4>
            <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100/50 text-slate-600 font-bold leading-relaxed text-sm">
              <p>
                매일 저녁 7시, 긍정 에너지로 꽉 찬 방송을 약속합니다! RPG 게임을
                좋아하며 시청자분들과 소통하는 것을 가장 행복하게 생각합니다.
                언제든지 편하게 놀러 오세요!
              </p>
            </div>
          </div>

          {/* 최근 방송 이력 (플레이한 게임) */}
          <div className="space-y-4 px-2 pt-2">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: streamer.colorCode }}
              ></span>
              최근 플레이한 게임
            </h4>
            {/* 가로 스크롤 게임 배지 리스트 */}
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar px-1">
              {[
                '로스트아크',
                '젤다의 전설',
                '메이플스토리',
                '원신',
                '리그 오브 레전드',
              ].map((game) => (
                <div
                  key={game}
                  className="flex-none flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100 text-slate-500 font-bold text-xs shadow-sm hover:border-slate-200 hover:text-slate-700 transition-all"
                >
                  <Gamepad2 className="w-4 h-4" />
                  {game}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 하단 닫기 버튼 */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
          <button
            className="flex-1 py-4 bg-white text-slate-600 rounded-2xl font-black border border-slate-200 hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
            onClick={() => router.back()}
          >
            돌아가기
          </button>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={streamer.chzzkUrl || '#'}
            className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
          >
            채널 방문 <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}
