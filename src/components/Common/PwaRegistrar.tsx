'use client';

import { useEffect } from 'react';

export default function PwaRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // 개발: 이전에 등록된 SW가 /_next 청크를 캐시하면 RSC Flight와 번들 버전이 어긋나 디코더 오류가 납니다.
    if (process.env.NODE_ENV === 'development') {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => {
          void r.unregister();
        });
      });
      return;
    }

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // no-op: PWA registration failures should not break app usage
    });
  }, []);

  return null;
}
