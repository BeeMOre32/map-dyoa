'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

/** next-themes: SSR·hydration 첫 패스에서는 항상 false → 서버 마크업과 클라이언트 1패스 일치 */
export function useIsDarkAfterMount(): boolean {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && resolvedTheme === 'dark';
}
