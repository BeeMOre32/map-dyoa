import type { Transition, Variants } from 'motion/react';

const springIn = (delay = 0): Transition => ({
  type: 'spring',
  visualDuration: 0.28,
  bounce: 0.12,
  delay,
});

export const clipCardVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springIn(Math.min(i * 0.04, 0.4)),
  }),
};

export const clipGridPresenceVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', visualDuration: 0.3, bounce: 0.1 },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.16, ease: [0.4, 0, 1, 1] },
  },
};

export const clipEmptyStateVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', visualDuration: 0.32, bounce: 0.12 },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.14 },
  },
};

export const clipPaginationBarVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', visualDuration: 0.28, bounce: 0.1 },
  },
};

export const CLIP_PAGE_TAB_LAYOUT_ID = 'clip-pagination-tab';

export const clipModalRevealContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.045, delayChildren: 0.04 },
  },
};

export const clipModalRevealItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springIn(0),
  },
};

export const clipSkeletonCardVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: springIn(Math.min(i * 0.035, 0.3)),
  }),
};
