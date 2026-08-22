import type { Transition, Variants } from 'motion/react';

/** Motion 권장: visualDuration + bounce. stiffness/damping은 체감 길이·탄성으로 매핑 */
export const statsSpring = (delay = 0, stiffness = 280, damping = 32): Transition => ({
  type: 'spring',
  visualDuration: stiffness >= 360 ? 0.22 : stiffness >= 300 ? 0.28 : stiffness >= 260 ? 0.34 : 0.4,
  bounce: damping <= 28 ? 0.18 : damping <= 32 ? 0.12 : 0.08,
  delay,
});

export const statsEaseOut: Transition = {
  duration: 0.28,
  ease: [0.32, 0.72, 0, 1],
};

export type StatsSlideDirection = 'left' | 'right';

export const STATS_MONTH_ROW_LAYOUT_ID = 'stats-month-row-active';

export const statsPageHeaderVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      default: statsSpring(0, 300, 34),
      opacity: { duration: 0.22, ease: 'easeOut' },
    },
  },
};

export const statsSectionVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
    scale: 0.985,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      default: statsSpring(Math.min(i * 0.055, 0.35), 260, 34),
      opacity: { duration: 0.22, ease: 'easeOut', delay: Math.min(i * 0.055, 0.35) },
    },
  }),
};

export const statsTileGridVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.04,
    },
  },
};

export const statsTileVariants: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: statsSpring(0, 320, 30),
  },
};

export const statsListVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

export const statsRowVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      default: statsSpring(0, 300, 32),
      opacity: { duration: 0.2, ease: 'easeOut' },
    },
  },
};

export const statsBarVariants: Variants = {
  hidden: { scaleX: 0, originX: 0 },
  visible: (pct: number) => ({
    scaleX: pct / 100,
    transition: statsSpring(0.06, 240, 28),
  }),
};

export const statsColumnVariants: Variants = {
  hidden: { scaleY: 0, opacity: 0.5 },
  visible: (pct: number) => ({
    scaleY: pct > 0 ? Math.max(pct / 100, 0.08) : 0,
    opacity: 1,
    transition: statsSpring(0.08, 260, 30),
  }),
};

/** 월 전환 — AnimatePresence custom 방향 */
export const statsMonthPresenceVariants: Variants = {
  enter: (direction: StatsSlideDirection) => ({
    opacity: 0,
    x: direction === 'left' ? 28 : -28,
    scale: 0.98,
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      default: statsSpring(0, 260, 32),
      opacity: { duration: 0.22, ease: 'easeOut' },
    },
  },
  exit: (direction: StatsSlideDirection) => ({
    opacity: 0,
    x: direction === 'left' ? -22 : 22,
    scale: 0.98,
    transition: statsEaseOut,
  }),
};

export const statsMonthLabelVariants: Variants = {
  enter: (direction: StatsSlideDirection) => ({
    opacity: 0,
    y: direction === 'left' ? 10 : -10,
  }),
  center: {
    opacity: 1,
    y: 0,
    transition: statsSpring(0, 340, 36),
  },
  exit: (direction: StatsSlideDirection) => ({
    opacity: 0,
    y: direction === 'left' ? -8 : 8,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
  }),
};

export const statsTableRowVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: statsSpring(Math.min(i * 0.035, 0.28), 300, 34),
  }),
};

export const statsBusyDayVariants: Variants = {
  hidden: { opacity: 0, x: -16, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: statsSpring(Math.min(i * 0.07, 0.35), 280, 32),
  }),
};

export const statsInteractiveHover = {
  whileHover: { y: -2, scale: 1.015, transition: statsSpring(0, 420, 28) },
  whileTap: { scale: 0.985, transition: { type: 'spring' as const, visualDuration: 0.16, bounce: 0.1 } },
};

/** 섹션 제목 등장 */
export const statsHeadingVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      default: statsSpring(0.05, 320, 34),
      opacity: { duration: 0.2, ease: 'easeOut', delay: 0.05 },
    },
  },
};

/** 배너·토스트 등 상단 UI */
export const statsBannerVariants: Variants = {
  hidden: { opacity: 0, y: -10, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      default: statsSpring(0, 280, 32),
      opacity: { duration: 0.2, ease: 'easeOut' },
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    marginBottom: 0,
    transition: statsEaseOut,
  },
};

/** Wrapped 히어로 — statsSection과 동일 톤, 살짝 더 큼 */
export const statsWrappedHeroPresence: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      default: statsSpring(0.06, 260, 32),
      opacity: { duration: 0.24, ease: 'easeOut', delay: 0.06 },
    },
  },
};

/** Wrapped 장식 — reduced motion 시 생략 */
export const statsWrappedOrbMotion = {
  animate: {
    x: [0, 14, -8, 0],
    y: [0, -10, 8, 0],
    scale: [1, 1.08, 0.96, 1],
  },
  transition: {
    duration: 10,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

export const statsWrappedShimmerMotion = {
  animate: { x: ['-120%', '220%'] },
  transition: {
    duration: 3.2,
    repeat: Infinity,
    repeatDelay: 6,
    ease: [0.45, 0, 0.55, 1] as const,
  },
};
