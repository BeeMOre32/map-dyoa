'use client';

import { useEffect } from 'react';

/** URL 해시(#pwa 등)에 맞춰 해당 `<details>`를 열고 스크롤합니다. RSC 스트림과 무관한 최소 클라이언트 코드입니다. */
export default function OpenHashDetails() {
  useEffect(() => {
    const apply = () => {
      const slug = window.location.hash.replace(/^#/, '');
      if (!slug) return;
      const el = document.getElementById(slug);
      if (el instanceof HTMLDetailsElement) {
        el.open = true;
        requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);
  return null;
}
