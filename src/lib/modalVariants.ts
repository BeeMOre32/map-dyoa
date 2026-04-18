import { Variants } from 'framer-motion';

/**
 * 모달 배경 페이드 인/아웃 효과
 */
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

/**
 * 모달 스케일 + 슬라이드 효과 팩토리 함수
 * @param config - scale 값 (기본값: 0.85), y 오프셋 (기본값: 20)
 * @returns Variants 객체
 */
export const createModalVariants = (config?: {
  scale?: number;
  y?: number;
}): Variants => ({
  hidden: {
    opacity: 0,
    scale: config?.scale ?? 0.85,
    y: config?.y ?? 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 350,
    },
  },
});

/**
 * 기본 모달 변형 (scale: 0.9, y: 20)
 */
export const defaultModalVariants = createModalVariants({
  scale: 0.9,
  y: 20,
});

/**
 * 부드러운 모달 변형 (scale: 0.95, y: 30)
 */
export const smoothModalVariants = createModalVariants({
  scale: 0.95,
  y: 30,
});
