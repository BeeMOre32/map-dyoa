'use client';

import { useModalDismiss } from '@/hooks/useModalDismiss';

/** @deprecated 이름만 유지 — 항상 mother로 `replace` (router.back 미사용) */
export function useGoBack(fallback: string) {
  return useModalDismiss({ mother: fallback });
}
