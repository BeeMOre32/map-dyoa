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

export function calendarGridSlide(direction: 'left' | 'right') {
  const x = direction === 'left' ? 28 : -28;
  return {
    initial: { opacity: 0, x },
    animate: { opacity: 1, x: 0 },
    transition: { type: 'spring' as const, damping: 28, stiffness: 320 },
  };
}

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
