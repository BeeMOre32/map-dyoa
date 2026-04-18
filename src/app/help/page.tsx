'use client';

import { motion } from 'framer-motion';
import {
  BookOpen,
  CalendarDays,
  MousePointerClick,
  Edit2,
  Trash2,
  LogIn,
  Sparkles,
  ArrowRight,
  Gamepad2,
  Users,
  Mail,
  GitBranch,
} from 'lucide-react';
import Link from 'next/link';

// 애니메이션 설정
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function GuidePage() {
  return (
    // 🌟 h-screen과 overflow-y-auto를 통해 페이지 자체적으로 스크롤을 생성합니다.
    <div className="h-screen w-full overflow-y-auto custom-scrollbar bg-slate-50/50 py-12 px-4 sm:px-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-3xl mx-auto space-y-8 pb-12"
      >
        {/* 🌟 헤더 섹션 */}
        <motion.div
          variants={itemVariants}
          className="text-center space-y-4 mb-12"
        >
          <div className="inline-flex items-center justify-center p-4 bg-indigo-100 text-indigo-600 rounded-[2rem] mb-4 shadow-sm">
            <BookOpen className="w-10 h-10" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            이용 가이드
          </h1>
          <p className="text-lg font-bold text-slate-500">
            스트리머 합방 및 일정 캘린더를 100% 활용하는 방법
          </p>
        </motion.div>

        {/* 🌟 주요 기능 설명 카드들 */}
        <div className="space-y-6">
          {/* 1. 일정 확인하기 */}
          <motion.div
            variants={itemVariants}
            className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
                <CalendarDays className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-800">
                1. 일정 한눈에 보기
              </h2>
            </div>
            <div className="space-y-4 text-slate-600 font-medium">
              <p className="flex items-start gap-3">
                <MousePointerClick className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  달력에 표시된 일정을 <strong>클릭</strong>하면 상세 모달이
                  열립니다.
                </span>
              </p>
              <p className="flex items-start gap-3">
                <Gamepad2 className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  상세 페이지에서는 진행하는 <strong>게임(콘텐츠)</strong>과
                  날짜, 시간을 확인할 수 있습니다.
                </span>
              </p>
              <p className="flex items-start gap-3">
                <Users className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  해당 일정에 참여하는 <strong>스트리머 목록</strong>이 고유
                  색상과 함께 표시됩니다.
                </span>
              </p>
            </div>
          </motion.div>

          {/* 2. 로그인 및 권한 */}
          <motion.div
            variants={itemVariants}
            className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
                <LogIn className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-800">
                2. 로그인과 편집 권한
              </h2>
            </div>
            <p className="text-slate-600 font-medium mb-4">
              구글 계정으로 <strong>로그인한 사용자라면 누구나</strong> 캘린더에
              기여할 수 있습니다.
            </p>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
              <span className="text-sm font-bold text-slate-700">
                로그인 후에는 숨겨져 있던 '일정 추가', '수정', '삭제' 버튼이
                마법처럼 나타납니다!
              </span>
            </div>
          </motion.div>

          {/* 3. 수정 및 삭제 */}
          <motion.div
            variants={itemVariants}
            className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl">
                <Edit2 className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-800">
                3. 일정 수정 및 삭제하기
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-2 mb-3 text-slate-800 font-black">
                  <Edit2 className="w-4 h-4 text-indigo-500" />
                  내용 수정하기
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  상세 페이지 하단의 수정 버튼을 누르면{' '}
                  <strong>화면 이동 없이 그 자리에서 바로</strong> 내용을 변경할
                  수 있습니다.
                </p>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-2 mb-3 text-slate-800 font-black">
                  <Trash2 className="w-4 h-4 text-red-500" />
                  삭제하기
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  취소되거나 잘못 등록된 일정은 휴지통 버튼을 눌러 삭제할 수
                  있습니다. (삭제 시 복구 불가)
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 🌟 하단 네비게이션 및 소셜 링크 */}
        <motion.div
          variants={itemVariants}
          className="pt-12 flex flex-col items-center gap-8"
        >
          {/* 캘린더 복귀 버튼 */}
          <Link
            href="/calendar"
            className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-[2rem] font-black hover:bg-slate-800 hover:scale-105 transition-all shadow-xl shadow-slate-200"
          >
            캘린더로 돌아가기
            <ArrowRight className="w-5 h-5" />
          </Link>

          {/* 개발자 연락처 / 깃허브 링크 */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/yourusername/your-repo"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-white text-slate-400 rounded-full shadow-sm border border-slate-100 hover:text-slate-900 hover:shadow-md hover:-translate-y-1 transition-all"
                title="GitHub Repository"
              >
                <GitBranch className="w-5 h-5" />
              </a>

              <a
                href="mailto:windowssart01@gmail.com"
                className="p-4 bg-white text-slate-400 rounded-full shadow-sm border border-slate-100 hover:text-indigo-500 hover:shadow-md hover:-translate-y-1 transition-all"
                title="Send Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
            <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">
              Created by someone who loves map
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
