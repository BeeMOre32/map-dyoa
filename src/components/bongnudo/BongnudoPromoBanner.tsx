'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Radio, X } from 'lucide-react';
import { BONGNUDO2_PATH, BONGNUDO2_PROMO_DISMISSED_KEY } from '@/config/bongnudo2';
import { isBongnudoPromoActive } from '@/lib/bongnudo';

export default function BongnudoPromoBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isBongnudoPromoActive()) return;
    if (localStorage.getItem(BONGNUDO2_PROMO_DISMISSED_KEY)) return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="mb-3 flex items-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/80 px-3 py-2.5 dark:border-indigo-900/50 dark:bg-indigo-950/40 sm:mb-4 sm:px-4">
      <Radio className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
      <Link
        href={BONGNUDO2_PATH}
        className="min-w-0 flex-1 text-[12px] font-black text-indigo-800 hover:underline dark:text-indigo-200 sm:text-sm"
      >
        봉누도 2
        <span className="ml-1.5 font-bold text-indigo-600/70 dark:text-indigo-400/80">멤버 · 달력 · 멀티뷰</span>
      </Link>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(BONGNUDO2_PROMO_DISMISSED_KEY, '1');
          setVisible(false);
        }}
        className="rounded-lg p-1 text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
        aria-label="봉누도 안내 닫기"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
