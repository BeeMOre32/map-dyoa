'use client';

import { useState } from 'react';
import {
  Sun, Moon, HelpCircle, Shield, LogIn, LogOut, UserCheck, X,
  LayoutDashboard, EyeOff, Heart, Megaphone, FlaskConical, PanelRight, LayoutGrid, Bell, BellOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useScrollLock } from '@/hooks/useScrollLock';
import { useHideEndedStreams } from '@/hooks/useHideEndedStreams';
import { useExperimentalFeatures } from '@/hooks/useExperimentalFeatures';
import { useToast } from '@/components/Common/Toaster';
import { getReminderEnabled, setReminderEnabled } from '@/lib/reminder-settings';

interface SettingsModalProps {
  onClose: () => void;
}

type Tab = 'general' | 'experimental';

function Toggle({ on, color = 'indigo' }: { on: boolean; color?: 'indigo' | 'violet' }) {
  const bg = on
    ? color === 'violet' ? 'bg-violet-500' : 'bg-indigo-500'
    : 'bg-slate-200 dark:bg-slate-600';
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
  const cls = 'w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-colors';
  if (onClick) return <button onClick={onClick} className={cls}>{children}</button>;
  return <div className={cls}>{children}</div>;
}

function GeneralTab({
  onClose,
  isDark,
  setTheme,
  hideEnded,
  setHideEnded,
  session,
}: {
  onClose: () => void;
  isDark: boolean;
  setTheme: (t: string) => void;
  hideEnded: boolean;
  setHideEnded: (v: boolean) => void;
  session: ReturnType<typeof useSession>['data'];
}) {
  return (
    <motion.div
      key="general"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.15 }}
      className="space-y-2"
    >
      {/* 테마 */}
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
                {isDark
                  ? <Sun className="w-4 h-4 text-amber-400" />
                  : <Moon className="w-4 h-4 text-indigo-500" />}
              </motion.div>
            </AnimatePresence>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
            </span>
          </div>
          <Toggle on={isDark} />
        </SettingRow>
      </div>

      {/* 캘린더 */}
      <div className="px-2 py-1">
        <SectionLabel>캘린더</SectionLabel>
        <SettingRow onClick={() => setHideEnded(!hideEnded)}>
          <div className="flex items-center gap-3">
            <EyeOff className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <div className="text-left">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">종료된 방송 숨기기</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">완료 처리된 일정을 캘린더에서 숨깁니다</p>
            </div>
          </div>
          <Toggle on={hideEnded} />
        </SettingRow>
      </div>

      {/* 후원 */}
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

      {/* 정보 */}
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

      {/* 계정 */}
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
    </motion.div>
  );
}

function ExperimentalTab({
  flags,
  setFlag,
  reminderEnabled,
  onToggleReminder,
}: {
  flags: ReturnType<typeof useExperimentalFeatures>['flags'];
  setFlag: ReturnType<typeof useExperimentalFeatures>['setFlag'];
  reminderEnabled: boolean;
  onToggleReminder: () => void;
}) {
  const featureItems = [
    {
      key: 'newScheduleModal' as const,
      icon: <PanelRight className="w-4 h-4 text-violet-400 shrink-0" />,
      label: '새 일정 모달 UI',
      desc: '일정 카드 클릭 시 새 디자인 모달을 사용합니다',
    },
    {
      key: 'newCalendarUI' as const,
      icon: <LayoutGrid className="w-4 h-4 text-violet-400 shrink-0" />,
      label: '새 캘린더 UI',
      desc: '주간 보기에서 카드형 캘린더 레이아웃을 사용합니다',
    },
  ];

  return (
    <motion.div
      key="experimental"
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.15 }}
      className="space-y-4"
    >
      <div className="flex gap-3 px-4 py-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-2xl">
        <FlaskConical className="w-4 h-4 text-violet-500 dark:text-violet-400 shrink-0 mt-0.5" />
        <p className="text-xs text-violet-600 dark:text-violet-400 font-medium leading-relaxed">
          아직 검토 중인 기능들입니다. 예기치 않은 동작이 있을 수 있습니다.
        </p>
      </div>

      <div className="px-2 space-y-1">
        <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">기능</p>
        {featureItems.map(({ key, icon, label, desc }) => (
          <button
            key={key}
            onClick={() => setFlag(key, !flags[key])}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-colors"
          >
            <div className="flex items-center gap-3">
              {icon}
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</p>
                  <span className="px-1.5 py-px bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 text-[9px] font-black rounded uppercase tracking-wide">Beta</span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">{desc}</p>
              </div>
            </div>
            <Toggle on={flags[key]} color="violet" />
          </button>
        ))}
        <button
          onClick={onToggleReminder}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-colors"
        >
          <div className="flex items-center gap-3">
            {reminderEnabled ? (
              <Bell className="w-4 h-4 text-violet-400 shrink-0" />
            ) : (
              <BellOff className="w-4 h-4 text-violet-400 shrink-0" />
            )}
            <div className="text-left">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  웹 푸시 놓치기 알림
                </p>
                <span className="px-1.5 py-px bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 text-[9px] font-black rounded uppercase tracking-wide">
                  Beta
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                시작 10분 전에 브라우저/백그라운드 푸시 알림을 보냅니다
              </p>
            </div>
          </div>
          <Toggle on={reminderEnabled} color="violet" />
        </button>
        <div className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
          <div className="flex items-center gap-3">
            <LayoutGrid className="w-4 h-4 text-violet-400 shrink-0" />
            <div className="text-left">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  PWA 설치 배너
                </p>
                <span className="px-1.5 py-px bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 text-[9px] font-black rounded uppercase tracking-wide">
                  Beta
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                설치 가능한 환경에서 하단 설치 배너가 표시됩니다
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-violet-500 dark:text-violet-400">
            ON
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [hideEnded, setHideEnded] = useHideEndedStreams();
  const { flags, setFlag } = useExperimentalFeatures();
  const [tab, setTab] = useState<Tab>('general');
  const [reminderEnabled, setReminderEnabledState] = useState(() =>
    getReminderEnabled(),
  );
  const toast = useToast();
  const isDark = resolvedTheme === 'dark';

  useEscapeKey(onClose);
  useScrollLock();

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  };

  const registerPushSubscription = async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('서비스워커를 지원하지 않는 브라우저입니다.');
    }

    const keyRes = await fetch('/api/push/public-key');
    if (!keyRes.ok) {
      throw new Error('푸시 공개 키를 불러오지 못했습니다.');
    }
    const { publicKey } = (await keyRes.json()) as { publicKey: string };

    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }));

    const saveRes = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });

    if (!saveRes.ok) {
      throw new Error('푸시 구독 저장에 실패했습니다.');
    }
  };

  const unregisterPushSubscription = async () => {
    if (!('serviceWorker' in navigator)) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
    await subscription.unsubscribe();
  };

  const handleToggleReminder = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('이 브라우저는 알림을 지원하지 않습니다.');
      return;
    }

    if (reminderEnabled) {
      try {
        await unregisterPushSubscription();
      } catch {
        // keep local toggle behavior even if unsubscribe request fails
      }
      setReminderEnabled(false);
      setReminderEnabledState(false);
      toast.success('놓치기 알림이 꺼졌습니다.');
      return;
    }

    const permission =
      Notification.permission === 'default'
        ? await Notification.requestPermission()
        : Notification.permission;

    if (permission !== 'granted') {
      toast.error('브라우저 알림 권한이 필요합니다.');
      return;
    }

    try {
      await registerPushSubscription();
      setReminderEnabled(true);
      setReminderEnabledState(true);
      toast.success('놓치기 알림이 켜졌습니다.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '푸시 구독에 실패했습니다.');
    }
  };

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

        <div className="flex gap-1 px-4 pt-3 pb-1 shrink-0">
          <button
            onClick={() => setTab('general')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-colors ${
              tab === 'general'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            일반
          </button>
          <button
            onClick={() => setTab('experimental')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-colors ${
              tab === 'experimental'
                ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <FlaskConical className="w-3 h-3" />
            실험적 기능
          </button>
        </div>

        <div className="p-4 space-y-2 overflow-y-auto flex-1 min-h-0">
          <AnimatePresence mode="wait" initial={false}>
            {tab === 'general' ? (
              <GeneralTab
                onClose={onClose}
                isDark={isDark}
                setTheme={setTheme}
                hideEnded={hideEnded}
                setHideEnded={setHideEnded}
                session={session}
              />
            ) : (
              <ExperimentalTab
                flags={flags}
                setFlag={setFlag}
                reminderEnabled={reminderEnabled}
                onToggleReminder={handleToggleReminder}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
