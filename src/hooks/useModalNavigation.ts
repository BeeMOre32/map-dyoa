/**
 * 모달 네비게이션 훅
 * 모달 닫기 로직 통합 (편집 모드, 라우팅 모드 등)
 */

'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UseModalNavigationOptions {
  isEditing?: boolean;
  onExitEditMode?: () => void;
}

/**
 * 모달 닫기 네비게이션 통합
 * - 편집 모드 여부 확인
 * - 딥 링크 여부 확인
 * - 라우터 back 또는 onClose 콜백 사용
 */
export function useModalNavigation(
  options?: UseModalNavigationOptions & { onClose?: () => void },
) {
  const router = useRouter();
  const { isEditing = false, onExitEditMode, onClose } = options || {};

  const handleClose = useCallback(() => {
    // 편집 모드면 먼저 편집 모드 종료
    if (isEditing && onExitEditMode) {
      onExitEditMode();
      return;
    }

    // 딥 링크 여부 확인
    const isDeepLinked =
      typeof window !== 'undefined' &&
      (window.location.pathname.includes('/day/') ||
        window.location.pathname.includes('/schedule/') ||
        window.location.pathname.includes('/detail/'));

    if (isDeepLinked) {
      // 딥 링크인 경우 뒤로 가기
      router.back();
    } else if (onClose) {
      // 모달 모드인 경우 onClose 콜백 실행
      onClose();
    }
  }, [isEditing, onExitEditMode, onClose, router]);

  return { handleClose };
}
