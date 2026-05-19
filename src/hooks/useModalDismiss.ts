'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { getMotherPath, navigateToMother } from '@/lib/modal-navigation';

type Options = {
  /** 기본값: 현재 pathname 기준 자동 */
  mother?: string;
  /** 로컬 state 정리 (이미 mother URL인 오버레이 모달) */
  onClose?: () => void;
};

/**
 * 모달 닫기·배경 클릭 시 상위 페이지로 이동.
 * - `/calendar/schedule/...` → `/calendar`
 * - `/streamers/detail/...` → `/streamers`
 * - 이미 `/clips` 위 오버레이면 onClose만 실행
 */
export function useModalDismiss(options?: Options) {
  const router = useRouter();
  const pathname = usePathname();
  const mother = options?.mother ?? getMotherPath(pathname);
  const onClose = options?.onClose;

  return useCallback(() => {
    onClose?.();
    // parallel @modal 안에서는 usePathname이 mother와 같게 나오는 경우가 있어 실제 URL 우선
    const currentPath =
      typeof window !== 'undefined' ? window.location.pathname : pathname;
    navigateToMother(router, currentPath, mother);
  }, [router, pathname, mother, onClose]);
}
