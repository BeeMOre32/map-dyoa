import type { Variants } from 'motion/react';

/** 모달·시트 닫힐 때 — 짧고 선형에 가깝게 */
const MODAL_EXIT_EASE = [0.4, 0, 1, 1] as const;

/** 모달 배경 페이드: 열릴 때는 살짝 길게, 닫힐 때는 빠르게 */
export const backdropVariants: Variants = {
  hidden: {
    opacity: 0,
    transition: { duration: 0.14, ease: MODAL_EXIT_EASE },
  },
  visible: {
    opacity: 1,
    transition: { duration: 0.26, ease: [0, 0, 0.2, 1] },
  },
};

/** 얇은 오버레이(바텀시트 등) */
export const sheetBackdropVariants: Variants = {
  hidden: {
    opacity: 0,
    transition: { duration: 0.12, ease: MODAL_EXIT_EASE },
  },
  visible: {
    opacity: 1,
    transition: { duration: 0.22, ease: [0, 0, 0.2, 1] },
  },
};

/**
 * 중앙 모달 카드: 열 때 스프링, 닫을 때 빠른 트위닝
 */
export const createModalVariants = (config?: {
  scale?: number;
  y?: number;
}): Variants => {
  const scale = config?.scale ?? 0.85;
  const y = config?.y ?? 20;
  return {
    hidden: {
      opacity: 0,
      scale,
      y,
      transition: {
        duration: 0.13,
        ease: MODAL_EXIT_EASE,
      },
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        default: { type: 'spring', visualDuration: 0.32, bounce: 0.1 },
        opacity: { duration: 0.2, ease: 'easeOut' },
      },
    },
  };
};

export const defaultModalVariants = createModalVariants({
  scale: 0.9,
  y: 20,
});

export const smoothModalVariants = createModalVariants({
  scale: 0.95,
  y: 30,
});

/** 확인·작은 다이얼로그용 */
export const compactModalVariants = createModalVariants({
  scale: 0.96,
  y: 12,
});

/** 일정 상세 옆 패널(데스크톱) */
export const companionPanelVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 16,
    scale: 0.97,
    transition: { duration: 0.14, ease: MODAL_EXIT_EASE },
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      default: { type: 'spring', visualDuration: 0.3, bounce: 0.08 },
      opacity: { duration: 0.18, ease: 'easeOut' },
    },
  },
};

/** 모바일 바텀시트 본체 */
export const bottomSheetVariants: Variants = {
  hidden: {
    y: '100%',
    transition: { duration: 0.17, ease: MODAL_EXIT_EASE },
  },
  visible: {
    y: 0,
    transition: { type: 'spring', visualDuration: 0.34, bounce: 0.08 },
  },
};

/** 캘린더 설정 드로어(좌측 패널) */
export const drawerPanelVariants: Variants = {
  hidden: {
    x: '-100%',
    transition: { duration: 0.15, ease: MODAL_EXIT_EASE },
  },
  visible: {
    x: 0,
    transition: { type: 'spring', visualDuration: 0.32, bounce: 0.06 },
  },
};

export const drawerBackdropVariants: Variants = {
  hidden: {
    opacity: 0,
    transition: { duration: 0.13, ease: MODAL_EXIT_EASE },
  },
  visible: {
    opacity: 1,
    transition: { duration: 0.22, ease: [0, 0, 0.2, 1] },
  },
};
