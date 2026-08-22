'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, Info } from 'lucide-react';
import ModalOverlayPortal from '@/components/Common/ModalOverlayPortal';
import { useScrollLock } from '@/hooks/useScrollLock';
import { backdropVariants, compactModalVariants } from '@/lib/modalVariants';
import { SITE_NOTICE_DISMISS_KEY, type SiteNoticeView } from './site-notice-shared';

const STYLES = {
  URGENT: {
    iconWrap: 'bg-red-50 dark:bg-red-900/20',
    icon: 'text-red-500 dark:text-red-400',
    btn: 'bg-red-500 hover:bg-red-600',
    Icon: AlertTriangle,
  },
  WARNING: {
    iconWrap: 'bg-amber-50 dark:bg-amber-900/20',
    icon: 'text-amber-500 dark:text-amber-400',
    btn: 'bg-amber-500 hover:bg-amber-600',
    Icon: AlertTriangle,
  },
  INFO: {
    iconWrap: 'bg-indigo-50 dark:bg-indigo-900/20',
    icon: 'text-indigo-500 dark:text-indigo-400',
    btn: 'bg-indigo-600 hover:bg-indigo-700',
    Icon: Info,
  },
} as const;

function PopupBody({ notice, onClose }: { notice: SiteNoticeView; onClose: () => void }) {
  useScrollLock();
  const s = STYLES[notice.level];
  const Icon = s.Icon;
  // 긴급 공지는 배경 클릭으로 닫히지 않고, 확인 버튼으로만 닫힌다.
  const closeOnBackdrop = notice.level !== 'URGENT';

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={backdropVariants}
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <motion.div
        variants={compactModalVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        role="alertdialog"
        aria-label={notice.title}
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl dark:shadow-black/60 border border-slate-100 dark:border-slate-800 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.iconWrap}`}>
            <Icon className={`w-6 h-6 ${s.icon}`} />
          </div>
          <h2 className="text-base font-black text-slate-800 dark:text-white leading-snug">
            {notice.title}
          </h2>
          {notice.body && (
            <p className="text-sm font-medium whitespace-pre-line text-slate-500 dark:text-slate-400 leading-relaxed">
              {notice.body}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className={`w-full py-2.5 rounded-2xl text-white font-bold text-sm transition-colors ${s.btn}`}
        >
          확인
        </button>
      </motion.div>
    </motion.div>
  );
}

/** 긴급(URGENT) 공지 — 중앙 팝업 모달 */
export default function SiteNoticePopup({ notice }: { notice: SiteNoticeView }) {
  const [show, setShow] = useState(false);
  const dismissKey = notice.dismissKey;

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const dismissed: string[] = JSON.parse(localStorage.getItem(SITE_NOTICE_DISMISS_KEY) ?? '[]');
        setShow(!dismissed.includes(dismissKey));
      } catch {
        setShow(true);
      }
    }, 0);
    return () => clearTimeout(id);
  }, [dismissKey]);

  const dismiss = () => {
    try {
      const dismissed: string[] = JSON.parse(localStorage.getItem(SITE_NOTICE_DISMISS_KEY) ?? '[]');
      localStorage.setItem(
        SITE_NOTICE_DISMISS_KEY,
        JSON.stringify([...new Set([...dismissed, dismissKey])].slice(-30)),
      );
    } catch {}
    setShow(false);
  };

  return (
    <ModalOverlayPortal>
      <AnimatePresence>
        {show && <PopupBody notice={notice} onClose={dismiss} />}
      </AnimatePresence>
    </ModalOverlayPortal>
  );
}
