'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileQuestionMark,
  LogIn,
  LogOut,
  Map,
  UserCheck,
  Sun,
  Moon, // 🌟 아이콘 추가
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion'; // 🌟 애니메이션용
import { useTheme } from 'next-themes'; // 🌟 만약 next-themes를 쓴다면
import Navigation from '../Navigation';

export default function Header() {
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 🌟 hydration 에러 방지용 (Client Component에서 테마 확인 시 필수)
  useEffect(() => setMounted(true), []);

  if (!mounted)
    return (
      <header className="py-3 px-6 md:px-8 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex justify-between items-center shrink-0" />
    );

  return (
    <header className="py-3 px-6 md:px-8 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex justify-between items-center shrink-0 sticky top-0 z-40 transition-all duration-500">
      {/* 🚀 로고 영역 */}
      <Link href="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none group-hover:rotate-6 transition-all duration-300">
          <Map className="w-6 h-6 text-white" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
            Map-Dyoa
          </h1>
          <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 mt-0.5 tracking-wider uppercase">
            Management
          </span>
        </div>
      </Link>

      {/* 🚀 내비게이션 */}
      <div className="shrink-0">
        <Navigation />
      </div>

      {/* 🚀 우측 영역 */}
      <div className="flex items-center gap-3 md:gap-5">
        <p className="text-sm text-slate-400 dark:text-slate-500 font-black hidden lg:block italic">
          "우왕 나도 지도동 됴아행"
        </p>

        <div className="flex items-center gap-2">
          {/* 🌟 다크모드 전환 버튼 (둥글게 + 애니메이션) */}
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="relative p-3 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all shadow-sm overflow-hidden group"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={resolvedTheme}
                initial={{ y: 20, opacity: 0, rotate: 45 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={{ y: -20, opacity: 0, rotate: -45 }}
                transition={{ duration: 0.3, ease: 'backOut' }}
              >
                {resolvedTheme === 'dark' ? (
                  <Sun className="w-5 h-5 text-amber-400 fill-amber-400" />
                ) : (
                  <Moon className="w-5 h-5 text-indigo-500 fill-indigo-500" />
                )}
              </motion.div>
            </AnimatePresence>
          </button>

          <Link
            href="/help"
            className="p-3 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all shadow-sm hover:shadow-md group"
            title="도움말"
          >
            <FileQuestionMark className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </Link>

          {session ? (
            <div className="flex items-center gap-2 md:gap-3">
              <div className="hidden md:flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-800 text-[10px] font-black uppercase">
                <UserCheck className="w-3 h-3" /> Admin
              </div>

              <button
                onClick={() => signOut()}
                className="p-3 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all shadow-sm hover:shadow-md group"
                title="로그아웃"
              >
                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="p-3 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all shadow-sm hover:shadow-md group"
              title="관리자 로그인"
            >
              <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
