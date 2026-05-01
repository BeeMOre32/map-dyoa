'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Map, Settings, LogIn, LogOut, UserCheck, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import Navigation from '../Navigation';
import SettingsModal from './SettingsModal';

export default function Header() {
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted)
    return (
      <header className="py-3 px-6 md:px-8 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex justify-between items-center shrink-0" />
    );

  return (
    <>
      <header className="py-3 px-6 md:px-8 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex items-center shrink-0 sticky top-0 z-40 transition-all duration-500">
        <Link href="/" className="flex items-center gap-2.5 group flex-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none group-hover:rotate-6 transition-all duration-300">
            <Map className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              Map-Dyoa
            </h1>
            <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 mt-0.5 tracking-wider uppercase hidden sm:block">
              Management
            </span>
          </div>
        </Link>

        <div className="shrink-0">
          <Navigation />
        </div>

        {/* 우측 버튼 영역 */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2 flex-1">
          {session ? (
            <>
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-800 text-[10px] font-black uppercase">
                <UserCheck className="w-3 h-3" /> Admin
              </div>
              <button
                onClick={() => signOut()}
                className="p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 transition-all shadow-sm"
                title="로그아웃"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 transition-all shadow-sm"
              title="관리자 로그인"
            >
              <LogIn className="w-4 h-4" />
            </Link>
          )}

          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="relative p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 transition-all shadow-sm overflow-hidden"
            title={resolvedTheme === 'dark' ? '라이트 모드' : '다크 모드'}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={resolvedTheme}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -12, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {resolvedTheme === 'dark'
                  ? <Sun className="w-4 h-4 text-amber-400" />
                  : <Moon className="w-4 h-4 text-indigo-500" />}
              </motion.div>
            </AnimatePresence>
          </button>

          <motion.button
            onClick={() => setSettingsOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors shadow-sm"
            title="설정"
          >
            <Settings className="w-4 h-4" />
          </motion.button>
        </div>
      </header>

      <AnimatePresence>
        {settingsOpen && (
          <SettingsModal onClose={() => setSettingsOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
