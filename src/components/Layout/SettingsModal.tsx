'use client';

import {
  Sun, Moon, HelpCircle, Shield, LogIn, LogOut, UserCheck, X,
  LayoutDashboard, EyeOff, Heart, Megaphone, History,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { backdropVariants, smoothModalVariants } from '@/lib/modalVariants';
import { useTheme } from 'next-themes';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useScrollLock } from '@/hooks/useScrollLock';
import { useHideEndedStreams } from '@/hooks/useHideEndedStreams';
import { useLegacyCalendarUi } from '@/hooks/useLegacyCalendarUi';

interface SettingsModalProps {
  onClose: () => void;
}

function Toggle({ on }: { on: boolean }) {
  const bg = on ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-600';
  return (
    <div className={`w-10 h-6 rounded-full relative transition-colors ${bg}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-1'}`} />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
      {children}
    </p>
  );
}

function SettingRow({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  const cls =
    'w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-colors';
  if (onClick) return <button onClick={onClick} className={cls}>{children}</button>;
  return <div className={cls}>{children}</div>;
}

function GeneralTab({
  onClose,
  isDark,
  setTheme,
  hideEnded,
  setHideEnded,
  legacyUi,
  setLegacyUi,
  session,
}: {
  onClose: () => void;
  isDark: boolean;
  setTheme: (t: string) => void;
  hideEnded: boolean;
  setHideEnded: (v: boolean) => void;
  legacyUi: boolean;
  setLegacyUi: (v: boolean) => void;
  session: ReturnType<typeof useSession>['data'];
}) {
  return (
    <div className="space-y-2">
      <div className="px-2 py-1">
        <SectionLabel>화면</SectionLabel>
        <SettingRow onClick={() => setTheme(isDark ? 'light' : 'dark')}>
          <div className="flex items-center gap-3">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isDark ? 'dark' : 'light'}
                initial={{ rotate: -45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 45, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
              </motion.div>
            </AnimatePresence>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
            </span>
          </div>
          <Toggle on={isDark} />
        </SettingRow>
      </div>

      <div className="px-2 py-1">
        <SectionLabel>관심 멤버</SectionLabel>
        <p className="px-4 pb-2 text-xs font-medium text-slate-400 dark:text-slate-500">
          캘린더·멤버·클립 상단의 「전체 / 관심 멤버」로 즐겨찾기만 볼 수 있습니다. 멤버는
          캘린더 필터에서 별 아이콘으로 등록하세요.
        </p>
      </div>

      <div className="px-2 py-1">
        <SectionLabel>캐린더</SectionLabel>
        <SettingRow onClick={() => setHideEnded(!hideEnded)}>
          <div className="flex items-center gap-3">
            <EyeOff className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <div className="text-left">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">종료된 방송 숨기기</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">완료 처리된 일정을 캐린더에서 숨깁니다</p>
            </div>
          </div>
          <Toggle on={hideEnded} />
        </SettingRow>
        <SettingRow onClick={() => setLegacyUi(!legacyUi)}>
          <div className="flex items-center gap-3">
            <History className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <div className="text-left">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">구버전 UI로 보기</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                이전 캘린더·일정 모달 디자인을 사용합니다
              </p>
            </div>
          </div>
          <Toggle on={legacyUi} />
        </SettingRow>
      </div>

      <a
        href="https://ctee.kr/place/mapdoya"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 px-4 py-3 mx-2 bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/30 border border-pink-200 dark:border-pink-800/50 rounded-2xl transition-colors"
      >
        <Heart className="w-4 h-4 text-pink-500 dark:text-pink-400 shrink-0" />
        <div>
          <p className="text-sm font-bold text-pink-600 dark:text-pink-400">후원하기</p>
          <p className="text-xs text-pink-400 dark:text-pink-500 font-medium mt-0.5">서버비 제외 전액 기부됩니다</p>
        </div>
      </a>

      <div className="px-2 py-1">
        <SectionLabel>정보</SectionLabel>
        <div className="space-y-1">
          {[
            { href: '/announcements', icon: <Megaphone className="w-4 h-4 text-slate-400 dark:text-slate-500" />, label: '공지사항' },
            { href: '/help', icon: <HelpCircle className="w-4 h-4 text-slate-400 dark:text-slate-500" />, label: '도움말' },
            { href: '/privacy', icon: <Shield className="w-4 h-4 text-slate-400 dark:text-slate-500" />, label: '개인정보처리방침' },
          ].map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-colors"
            >
              {icon}
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="px-2 py-1">
        <SectionLabel>계정</SectionLabel>
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
  );
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [hideEnded, setHideEnded] = useHideEndedStreams();
  const [legacyUi, setLegacyUi] = useLegacyCalendarUi();
  const isDark = resolvedTheme === 'dark';

  useEscapeKey(onClose);
  useScrollLock();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={backdropVariants}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 dark:bg-slate-950/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        variants={smoothModalVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="w-full max-w-sm max-h-[90dvh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl dark:shadow-black/60 border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-black text-slate-800 dark:text-white">설정</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2 overflow-y-auto flex-1 min-h-0">
          <GeneralTab
            onClose={onClose}
            isDark={isDark}
            setTheme={setTheme}
            hideEnded={hideEnded}
            setHideEnded={setHideEnded}
            legacyUi={legacyUi}
            setLegacyUi={setLegacyUi}
            session={session}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
