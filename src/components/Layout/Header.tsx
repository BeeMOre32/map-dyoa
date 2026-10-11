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
            <motion.div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl overflow-hidden shadow-lg shadow-indigo-200 dark:shadow-none"
              whileHover={{ rotate: 8, scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', visualDuration: 0.28, bounce: 0.22 }}
            >
              <Image
                src="/brand/map-dyoa-logo.svg"
                alt={`${SITE_BRAND} 로고`}
                width={40}
                height={40}
                className="w-full h-full object-cover"
                priority
              />
            </motion.div>
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
          <div className="ml-auto flex shrink-0 items-center justify-end gap-1.5">
            {session ? (
              <>
                <div className="hidden h-8 items-center gap-1 rounded-xl border border-emerald-100 bg-emerald-50 px-2 text-[10px] font-black uppercase text-emerald-600 sm:inline-flex dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                  <UserCheck className="h-3.5 w-3.5" /> Admin
                </div>
                <motion.button
                  onClick={() => signOut()}
                  whileHover={{ scale: 1.06, transition: { type: 'spring', visualDuration: 0.22, bounce: 0.2 } }}
                  whileTap={{ scale: 0.94, transition: { type: 'spring', visualDuration: 0.16, bounce: 0.12 } }}
                  className="hidden h-8 w-8 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400 shadow-sm hover:bg-white hover:text-red-500 sm:inline-flex dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:hover:text-red-400"
                  title="로그아웃"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </motion.button>
              </>
            ) : (
              <motion.div
                className="hidden sm:inline-flex"
                whileHover={{ scale: 1.06, transition: { type: 'spring', visualDuration: 0.22, bounce: 0.2 } }}
                whileTap={{ scale: 0.94, transition: { type: 'spring', visualDuration: 0.16, bounce: 0.12 } }}
              >
              <Link
                href="/login"
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400 shadow-sm hover:bg-white hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                title="관리자 로그인"
              >
                <LogIn className="h-3.5 w-3.5" />
              </Link>
              </motion.div>
            )}

            <motion.button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              whileHover={{ scale: 1.06, transition: { type: 'spring', visualDuration: 0.22, bounce: 0.2 } }}
              whileTap={{ scale: 0.94, transition: { type: 'spring', visualDuration: 0.16, bounce: 0.12 } }}
              className="relative hidden h-8 w-8 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50 text-slate-500 shadow-sm hover:bg-white sm:inline-flex dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
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
                    ? <Sun className="h-3.5 w-3.5 text-amber-400" />
                    : <Moon className="h-3.5 w-3.5 text-indigo-500" />}
                </motion.div>
              </AnimatePresence>
            </motion.button>

            <motion.button
              onClick={() => setSettingsOpen(true)}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              variants={{
                rest: { scale: 1 },
                hover: { scale: 1.06 },
                tap: { scale: 0.94 },
              }}
              transition={{ type: 'spring', visualDuration: 0.22, bounce: 0.2 }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400 shadow-sm transition-colors hover:bg-white hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
              title="설정"
            >
              <motion.span
                className="inline-flex"
                variants={{
                  rest: { rotate: 0 },
                  hover: { rotate: 48 },
                  tap: { rotate: 90 },
                }}
                transition={{ type: 'spring', visualDuration: 0.32, bounce: 0.22 }}
              >
                <Settings className="h-3.5 w-3.5" />
              </motion.span>
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
