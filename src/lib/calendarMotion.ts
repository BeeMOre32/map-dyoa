import type { Transition, Variants } from 'motion/react';
import { statsMonthPresenceVariants, statsSpring, statsTileVariants } from '@/lib/statsMotion';

const calendarSpring = (delay = 0, stiffness = 280, damping = 32): Transition =>
  statsSpring(delay, stiffness, damping);

export const scheduleCardVariants = {
  weekly: statsTileVariants,
  monthly: {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        default: calendarSpring(Math.min(i * 0.04, 0.2), 300, 32),
        opacity: { duration: 0.18, ease: 'easeOut', delay: Math.min(i * 0.04, 0.2) },
      },
    }),
  },
  mobile: {
    hidden: { opacity: 0, x: -12 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        default: calendarSpring(Math.min(i * 0.045, 0.24), 300, 32),
        opacity: { duration: 0.18, ease: 'easeOut', delay: Math.min(i * 0.045, 0.24) },
      },
    }),
  },
} satisfies Record<string, Variants>;

export const calendarColumnVariants: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      default: calendarSpring(Math.min(i * 0.05, 0.28), 260, 34),
      opacity: { duration: 0.2, ease: 'easeOut', delay: Math.min(i * 0.05, 0.28) },
    },
  }),
};

/** @deprecated AnimatePresence용은 `calendarGridPresenceVariants` 사용. 캐시된 클라이언트 번들 호환용 유지 */
export function calendarGridSlide(direction: 'left' | 'right') {
  const x = direction === 'left' ? 28 : -28;
  return {
    initial: { opacity: 0, x },
    animate: { opacity: 1, x: 0 },
    exit: {
      opacity: 0,
      x: direction === 'left' ? -22 : 22,
      transition: { duration: 0.18, ease: [0.4, 0, 1, 1] as const },
    },
    transition: { type: 'spring' as const, visualDuration: 0.3, bounce: 0.1 },
  };
}

/** AnimatePresence mode="wait"용 주·월 그리드 슬라이드 — statsMotion 톤 */
export const calendarGridPresenceVariants = statsMonthPresenceVariants;

/** 일정 카드 → 상세 모달 shared layout */
export function scheduleSurfaceLayoutId(scheduleId: string) {
  return `schedule-surface-${scheduleId}`;
}

/** 모달 본문 stagger 등장 */
export const modalDetailRevealContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.055, delayChildren: 0.06 },
  },
};

export const modalDetailRevealItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: calendarSpring(0),
  },
};

export const skeletonBarVariants: Variants = {
  hidden: { opacity: 0.35 },
  visible: (i: number) => ({
    opacity: [0.35, 0.75, 0.35],
    transition: {
      duration: 1.4,
      repeat: Infinity,
      ease: 'easeInOut',
      delay: i * 0.08,
    },
  }),
};

export const skeletonContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};
