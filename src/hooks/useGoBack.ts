'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useGoBack(fallback: string) {
  const router = useRouter();
  return useCallback(() => router.push(fallback), [router, fallback]);
}
