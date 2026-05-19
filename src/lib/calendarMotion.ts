import type { Transition, Variants } from 'framer-motion';

const springIn = (delay = 0): Transition => ({
  type: 'spring',
  damping: 26,
  stiffness: 380,
  delay,
});

export const scheduleCardVariants = {
  weekly: {
    hidden: { opacity: 0, y: 12, scale: 0.97 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: springIn(i * 0.04),
    }),
  },
  monthly: {
    hidden: { opacity: 0, x: -8 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: springIn(i * 0.022),
    }),
  },
  mobile: {
    hidden: { opacity: 0, x: -14 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: springIn(i * 0.045),
    }),
  },
} satisfies Record<string, Variants>;

export const calendarColumnVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: springIn(i * 0.05),
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
    transition: { type: 'spring' as const, damping: 28, stiffness: 320 },
  };
}

/** AnimatePresence mode="wait"용 주·월 그리드 슬라이드 */
export const calendarGridPresenceVariants: Variants = {
  enter: (direction: 'left' | 'right') => ({
    opacity: 0,
    x: direction === 'left' ? 32 : -32,
  }),
  center: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', damping: 28, stiffness: 320 },
  },
  exit: (direction: 'left' | 'right') => ({
    opacity: 0,
    x: direction === 'left' ? -24 : 24,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  }),
};

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
    transition: springIn(0),
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
