import type { Transition, Variants } from 'framer-motion';

const springIn = (delay = 0): Transition => ({
  type: 'spring',
  damping: 26,
  stiffness: 380,
  delay,
});

export const streamerCardVariants: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springIn(Math.min(i * 0.035, 0.35)),
  }),
};

export const streamerListPresenceVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', damping: 28, stiffness: 340 },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.16, ease: [0.4, 0, 1, 1] },
  },
};

export const streamerMultiviewBarVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', damping: 30, stiffness: 400 },
  },
  exit: {
    opacity: 0,
    y: 16,
    transition: { duration: 0.14, ease: [0.4, 0, 1, 1] },
  },
};

/** 카드 아바타 ↔ 상세 모달 shared layout */
export function streamerAvatarLayoutId(streamerId: string) {
  return `streamer-avatar-${streamerId}`;
}

export const STREAMER_GEN_TAB_LAYOUT_ID = 'streamer-gen-tab';

/** 상세 모달 본문 stagger */
export const streamerModalRevealContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

export const streamerModalRevealItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springIn(0),
  },
};
