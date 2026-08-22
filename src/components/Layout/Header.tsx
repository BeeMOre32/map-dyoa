'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Settings, LogIn, LogOut, UserCheck, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from '@teispace/next-themes';
import Navigation from '../Navigation';
import SettingsModal from './SettingsModal';
import { SITE_BRAND, SITE_NAME, SITE_PRIMARY_TITLE } from '@/lib/site';

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
      <header className="sticky top-0 z-50 isolate shrink-0 border-b border-slate-200/80 bg-white px-2 py-2 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950 sm:px-4 sm:py-3 md:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-3 w-full">
          <Link
            href="/"
            aria-label={`${SITE_BRAND} ${SITE_PRIMARY_TITLE}`}
            className="flex items-center gap-2 sm:gap-2.5 group min-w-0 max-w-[52%] sm:max-w-none"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl overflow-hidden shadow-lg shadow-indigo-200 dark:shadow-none group-hover:rotate-6 transition-all duration-300">
              <Image
                src="/brand/map-dyoa-logo.svg"
                alt={`${SITE_BRAND} 로고`}
                width={40}
                height={40}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-sm font-black leading-none tracking-tight text-slate-900 dark:text-white sm:text-xl">
                {SITE_BRAND}
              </p>
              <span className="mt-0.5 hidden truncate text-[10px] font-bold tracking-wide text-indigo-500 dark:text-indigo-400 sm:block">
                방송 일정 · 클립 · {SITE_NAME}
              </span>
            </div>
          </Link>

          <div className="flex-1 min-w-0 flex justify-center px-1 sm:px-2">
            <Navigation />
          </div>

          {/* 우측 버튼 영역 */}
          <div className="flex items-center justify-end gap-1 sm:gap-2 shrink-0 ml-auto">
            {session ? (
              <>
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-800 text-[10px] font-black uppercase">
                  <UserCheck className="w-3 h-3" /> Admin
                </div>
                <button
                  onClick={() => signOut()}
                  className="hidden sm:inline-flex p-1.5 sm:p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 transition-all shadow-sm"
                  title="로그아웃"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline-flex p-1.5 sm:p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 transition-all shadow-sm"
                title="관리자 로그인"
              >
                <LogIn className="w-4 h-4" />
              </Link>
            )}

            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="hidden sm:inline-flex relative p-1.5 sm:p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 transition-all shadow-sm overflow-hidden"
              title={resolvedTheme === 'dark' ? '라이트 모드' : '다크 모드'}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={resolvedTheme}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -8, opacity: 0 }}
                  transition={{
                    type: 'spring',
                    visualDuration: 0.22,
                    bounce: 0.1,
                    opacity: { duration: 0.15 },
                  }}
                >
                  {resolvedTheme === 'dark'
                    ? <Sun className="w-4 h-4 text-amber-400" />
                    : <Moon className="w-4 h-4 text-indigo-500" />}
                </motion.div>
              </AnimatePresence>
            </button>

            <motion.button
              onClick={() => setSettingsOpen(true)}
              whileHover={{ scale: 1.06, transition: { type: 'spring', visualDuration: 0.22, bounce: 0.2 } }}
              whileTap={{ scale: 0.94, transition: { type: 'spring', visualDuration: 0.18, bounce: 0.15 } }}
              className="p-1.5 sm:p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors shadow-sm"
              title="설정"
            >
              <Settings className="w-4 h-4" />
            </motion.button>
          </div>
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
