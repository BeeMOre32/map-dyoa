// src/app/login/page.tsx
'use client';

import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { LogIn, Map, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 p-10 md:p-12 text-center border border-slate-100 dark:border-slate-700"
      >
        {/* 로고 영역 */}
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
          <Map className="w-10 h-10 text-white" />
        </div>

        {/* 텍스트 영역 */}
        <div className="space-y-3 mb-10">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
            MAP-DYOA
          </h1>
          <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm bg-indigo-50 dark:bg-indigo-900/20 w-fit mx-auto px-4 py-1.5 rounded-full">
            <ShieldCheck className="w-4 h-4" />
            Admin Access
          </div>
          <p className="text-slate-400 dark:text-slate-500 font-medium text-sm pt-2 leading-relaxed">
            지도동 일정 및 스트리머 관리를 위해
            <br />
            구글 계정으로 로그인이 필요합니다.
          </p>
        </div>

        {/* 로그인 버튼 */}
        <button
          onClick={() => signIn('google', { callbackUrl: '/calendar' })}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-slate-200 dark:shadow-indigo-900/30"
        >
          <LogIn className="w-5 h-5" />
          구글 계정으로 시작하기
        </button>

        {/* 하단 푸터 */}
        <div className="mt-10 pt-8 border-t border-slate-50 dark:border-slate-700">
          <p className="text-[11px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">
            © 2026 Map-Dyoa Project
          </p>
        </div>
      </motion.div>

      {/* 배경 장식 요소 (선택 사항) */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden opacity-40 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 dark:bg-indigo-900/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50 dark:bg-blue-900/30 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}
