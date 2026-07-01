'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Megaphone } from 'lucide-react';
import ModalOverlayPortal from '@/components/Common/ModalOverlayPortal';
import { useScrollLock } from '@/hooks/useScrollLock';
import { backdropVariants, compactModalVariants } from '@/lib/modalVariants';
import { announcementPopup } from '@/config/announcements';
import type { AnnouncementAccent } from '@/config/announcements';
import { ANNOUNCEMENT_DISMISS_KEY } from './announcement-shared';

const ACCENT_THEMES: Record<
  AnnouncementAccent,
  { iconWrap: string; icon: string; btn: string; title: string; content: string }
> = {
  indigo: {
    iconWrap: 'bg-indigo-50 dark:bg-indigo-900/20',
    icon: 'text-indigo-500 dark:text-indigo-400',
    btn: 'bg-indigo-600 hover:bg-indigo-700',
    title: 'text-slate-800 dark:text-white',
    content: 'text-slate-500 dark:text-slate-400',
  },
  teal: {
    iconWrap: 'bg-teal-50 dark:bg-teal-900/20',
    icon: 'text-teal-500 dark:text-teal-400',
    btn: 'bg-teal-600 hover:bg-teal-700',
    title: 'text-slate-800 dark:text-white',
    content: 'text-slate-500 dark:text-slate-400',
  },
  amber: {
    iconWrap: 'bg-amber-50 dark:bg-amber-900/20',
    icon: 'text-amber-500 dark:text-amber-400',
    btn: 'bg-amber-500 hover:bg-amber-600',
    title: 'text-slate-800 dark:text-white',
    content: 'text-slate-500 dark:text-slate-400',
  },
  rose: {
    iconWrap: 'bg-rose-50 dark:bg-rose-900/20',
    icon: 'text-rose-500 dark:text-rose-400',
    btn: 'bg-rose-600 hover:bg-rose-700',
    title: 'text-slate-800 dark:text-white',
    content: 'text-slate-500 dark:text-slate-400',
  },
};

function PopupBody({ onClose }: { onClose: () => void }) {
  useScrollLock();
  if (!announcementPopup) return null;

  const theme = ACCENT_THEMES[announcementPopup.accent ?? 'indigo'];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={backdropVariants}
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        variants={compactModalVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        role="dialog"
        aria-label={announcementPopup.title}
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl dark:shadow-black/60 border border-slate-100 dark:border-slate-800 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme.iconWrap}`}>
            <Megaphone className={`w-6 h-6 ${theme.icon}`} />
          </div>
          <h2 className={`text-base font-black leading-snug ${theme.title}`}>
            {announcementPopup.title}
          </h2>
          {announcementPopup.content && (
            <p className={`text-sm font-medium leading-relaxed ${theme.content}`}>
              {announcementPopup.content}
            </p>
          )}
        </div>
        <div className="space-y-2">
          {announcementPopup.href && (
            <Link
              href={announcementPopup.href}
              onClick={onClose}
              className={`flex w-full items-center justify-center rounded-2xl py-2.5 text-sm font-bold text-white transition-colors ${theme.btn}`}
            >
              공지 보기
            </Link>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            닫기
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** 운영 공지(정산 등) — 중앙 팝업 모달 */
export default function AnnouncementPopup() {
  const [show, setShow] = useState(false);
  const target = announcementPopup;

  useEffect(() => {
    if (!target) return;
    const id = setTimeout(() => {
      try {
        const dismissed: string[] = JSON.parse(
          localStorage.getItem(ANNOUNCEMENT_DISMISS_KEY) ?? '[]',
        );
        setShow(!dismissed.includes(target.id));
      } catch {
        setShow(true);
      }
    }, 600);
    return () => clearTimeout(id);
  }, [target]);

  const dismiss = () => {
    if (!target) return;
    try {
      const dismissed: string[] = JSON.parse(
        localStorage.getItem(ANNOUNCEMENT_DISMISS_KEY) ?? '[]',
      );
      localStorage.setItem(
        ANNOUNCEMENT_DISMISS_KEY,
        JSON.stringify([...new Set([...dismissed, target.id])]),
      );
    } catch {}
    setShow(false);
  };

  if (!target) return null;

  return (
    <ModalOverlayPortal>
      <AnimatePresence>
        {show && <PopupBody onClose={dismiss} />}
      </AnimatePresence>
    </ModalOverlayPortal>
  );
}
