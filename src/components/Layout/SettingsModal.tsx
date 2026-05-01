'use client';

import { Sun, Moon, HelpCircle, Shield, LogIn, LogOut, UserCheck, X, LayoutDashboard, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useHideEndedStreams } from '@/hooks/useHideEndedStreams';

interface SettingsModalProps {
  onClose: () => void;
}

function Toggle({ on }: { on: boolean }) {
  return (
    <div className={`w-10 h-6 rounded-full relative transition-colors ${on ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-600'}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-1'}`} />
    </div>
  );
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [hideEnded, setHideEnded] = useHideEndedStreams();
  const isDark = resolvedTheme === 'dark';

  useEscapeKey(onClose);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 dark:bg-slate-950/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl dark:shadow-black/60 border border-slate-100 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-black text-slate-800 dark:text-white">설정</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2">

          {/* 테마 */}
          <div className="px-2 py-1">
            <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">화면</p>
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-colors group"
            >
              <div className="flex items-center gap-3">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={resolvedTheme}
                    initial={{ rotate: -45, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 45, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isDark
                      ? <Sun className="w-4 h-4 text-amber-400" />
                      : <Moon className="w-4 h-4 text-indigo-500" />}
                  </motion.div>
                </AnimatePresence>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
                </span>
              </div>
              <div className={`w-10 h-6 rounded-full relative transition-colors ${isDark ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-600'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isDark ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
            </button>
          </div>

          {/* 캘린더 */}
          <div className="px-2 py-1">
            <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">캘린더</p>
            <button
              onClick={() => setHideEnded(!hideEnded)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <EyeOff className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">종료된 방송 숨기기</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">완료 처리된 일정을 캘린더에서 숨깁니다</p>
                </div>
              </div>
              <Toggle on={hideEnded} />
            </button>
          </div>

          {/* 링크 */}
          <div className="px-2 py-1">
            <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">정보</p>
            <div className="space-y-1">
              <Link
                href="/help"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">도움말</span>
              </Link>
              <Link
                href="/privacy"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-colors"
              >
                <Shield className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">개인정보처리방침</span>
              </Link>
            </div>
          </div>

          {/* 계정 */}
          <div className="px-2 py-1">
            <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">계정</p>
            <div className="space-y-1">
              {session ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
                    <UserCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">관리자 로그인 중</span>
                  </div>
                  <Link
                    href="/admin"
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">관리자 대시보드</span>
                  </Link>
                  <button
                    onClick={() => { signOut(); onClose(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 rounded-2xl transition-colors text-slate-400 dark:text-slate-500"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-bold">로그아웃</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-colors"
                >
                  <LogIn className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">관리자 로그인</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
