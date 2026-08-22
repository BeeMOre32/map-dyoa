'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import {
  X,
  Pin,
  Play,
  LayoutGrid,
  Maximize2,
  VolumeX,
  Headphones,
  MessageSquare,
  PanelRight,
  Puzzle,
  Radio,
  Keyboard,
  HelpCircle,
} from 'lucide-react';
import {
  MULTIVIEW_SELECT_COACH_DISMISSED_KEY,
  MULTIVIEW_WATCH_COACH_DISMISSED_KEY,
} from '@/constants/onboarding';
import { CHROME_EXTENSION_URL } from '@/constants/extension';

function useCoachDismissed(storageKey: string) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey) !== '1') {
        const t = setTimeout(() => setOpen(true), 600);
        return () => clearTimeout(t);
      }
    } catch {
      setOpen(true);
    }
  }, [storageKey]);

  const dismiss = (permanent: boolean) => {
    setOpen(false);
    if (permanent) {
      try {
        localStorage.setItem(storageKey, '1');
      } catch {
        /* ignore */
      }
    }
  };

  const reopen = () => setOpen(true);

  return { open, dismiss, reopen };
}

function CoachShell({
  title,
  children,
  onClose,
  onDismissPermanent,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onDismissPermanent: () => void;
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[180] bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        role="dialog"
        aria-labelledby="mv-coach-title"
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="fixed left-1/2 top-1/2 z-[190] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2"
      >
        <div className="rounded-[1.75rem] border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50 overflow-hidden">
          <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-slate-800">
            <div className="min-w-0">
              <p id="mv-coach-title" className="text-base font-black text-white">
                {title}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">30초면 익숙해져요</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 p-1.5 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-5 py-4 space-y-3 max-h-[min(60vh,420px)] overflow-y-auto">{children}</div>
          <div className="flex flex-col-reverse sm:flex-row gap-2 px-5 pb-5">
            <button
              type="button"
              onClick={onDismissPermanent}
              className="flex-1 py-2.5 rounded-xl text-xs font-black text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
            >
              다시 보지 않기
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition-colors"
            >
              알겠어요
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function TipRow({
  icon,
  label,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-slate-800 text-indigo-400">
        {icon}
      </div>
      <div className="min-w-0 pt-0.5">
        <p className="text-sm font-black text-white leading-snug">{label}</p>
        <p className="text-xs text-slate-400 font-medium leading-relaxed mt-0.5">{hint}</p>
      </div>
    </div>
  );
}

export function MultiviewSelectCoach() {
  const { open, dismiss } = useCoachDismissed(MULTIVIEW_SELECT_COACH_DISMISSED_KEY);

  return (
    <AnimatePresence>
      {open && (
        <CoachShell
          title="멀티뷰 시작하기"
          onClose={() => dismiss(false)}
          onDismissPermanent={() => dismiss(true)}
        >
          <TipRow
            icon={<LayoutGrid className="w-4 h-4" />}
            label="시청할 멤버 선택"
            hint={`탭해서 고르세요. 최대 9명까지 한 화면에 볼 수 있어요.`}
          />
          <TipRow
            icon={<Radio className="w-4 h-4" />}
            label="LIVE만 선택"
            hint="지금 방송 중인 멤버만 빠르게 골라 시작할 수 있어요."
          />
          <TipRow
            icon={<Puzzle className="w-4 h-4" />}
            label="Chrome 확장 프로그램"
            hint={
              'iframe 시청·채팅에 필요합니다. 아래 배너에서 설치 후 새로고침하세요.'
            }
          />
          <Link
            href={CHROME_EXTENSION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-black hover:bg-amber-500/20 transition-colors"
          >
            확장 프로그램 설치하기
          </Link>
        </CoachShell>
      )}
    </AnimatePresence>
  );
}

export function MultiviewWatchCoach({ onHelpClick }: { onHelpClick?: () => void }) {
  const { open, dismiss, reopen } = useCoachDismissed(MULTIVIEW_WATCH_COACH_DISMISSED_KEY);

  return (
    <>
      <button
        type="button"
        onClick={reopen}
        className="fixed bottom-5 left-4 z-[170] flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-800/90 border border-slate-700 text-slate-300 text-xs font-black shadow-lg backdrop-blur-sm hover:bg-slate-700 hover:text-white transition-colors"
        title="멀티뷰 버튼 안내"
      >
        <HelpCircle className="w-4 h-4" />
        <span className="hidden sm:inline">버튼 안내</span>
      </button>

      <AnimatePresence>
        {open && (
          <CoachShell
            title="주요 버튼 안내"
            onClose={() => dismiss(false)}
            onDismissPermanent={() => dismiss(true)}
          >
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-wide">상단 바</p>
            <TipRow
              icon={<Pin className="w-4 h-4" />}
              label="컨트롤 고정"
              hint="패널 위 버튼을 항상 보이게 합니다. 단축키 P"
            />
            <TipRow
              icon={<Play className="w-4 h-4" />}
              label="모두 시작 / 모두 끄기"
              hint="표시 중인 패널의 방송을 한꺼번에 켜거나 끕니다."
            />
            <TipRow
              icon={<LayoutGrid className="w-4 h-4" />}
              label="레이아웃"
              hint="자동 · 균등 · 1행 — 패널 배치를 바꿉니다."
            />

            <p className="text-[11px] font-black text-slate-500 uppercase tracking-wide pt-1">
              패널 (마우스 올리거나 모바일 하단 바)
            </p>
            <TipRow
              icon={<Maximize2 className="w-4 h-4" />}
              label="크게 보기"
              hint="한 방송만 크게 봅니다. 더블클릭 또는 숫자 1~9"
            />
            <TipRow
              icon={<VolumeX className="w-4 h-4" />}
              label="음소거"
              hint="패널별로 소리를 끄거나 켤 수 있어요."
            />
            <TipRow
              icon={<Headphones className="w-4 h-4" />}
              label="이 패널만 소리"
              hint="나머지는 음소거하고 선택한 방송만 들을 때."
            />
            <TipRow
              icon={<MessageSquare className="w-4 h-4" />}
              label="치지직 내장 채팅"
              hint="iframe 안 치지직 채팅 영역을 접거나 펼칩니다."
            />
            <TipRow
              icon={<PanelRight className="w-4 h-4" />}
              label="오른쪽 채팅 패널"
              hint="화면 오른쪽에 채팅만 따로 띄웁니다."
            />

            <TipRow
              icon={<Keyboard className="w-4 h-4" />}
              label="단축키"
              hint="1~9 포커스 · P 컨트롤 고정 · Esc 포커스/채팅 닫기"
            />

            {onHelpClick ? (
              <button
                type="button"
                onClick={() => {
                  dismiss(false);
                  onHelpClick();
                }}
                className="w-full py-2 text-xs font-black text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                자세한 설명은 이용 가이드 →
              </button>
            ) : (
              <Link
                href="/help#multiview"
                target="_blank"
                className="block w-full py-2 text-center text-xs font-black text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                자세한 설명은 이용 가이드 →
              </Link>
            )}
          </CoachShell>
        )}
      </AnimatePresence>
    </>
  );
}
