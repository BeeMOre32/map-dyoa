'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, X } from 'lucide-react';

const DISMISS_KEY = 'pwa:install-banner-dismissed:v1';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const isStandalone = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true
    );
  }, []);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
    } catch {
      setDismissed(false);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferredPrompt || dismissed || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-290 w-[min(92vw,420px)] rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-xl px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
          <Download className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-slate-800 dark:text-slate-100">
            앱으로 설치하고 더 빠르게 보기
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            홈 화면에 추가하면 전체 화면으로 더 빠르게 열 수 있어요.
          </p>
          <button
            type="button"
            onClick={async () => {
              if (!deferredPrompt) return;
              await deferredPrompt.prompt();
              const result = await deferredPrompt.userChoice;
              if (result.outcome === 'accepted') {
                setDeferredPrompt(null);
              }
            }}
            className="mt-2 h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black"
          >
            설치하기
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, '1');
            setDismissed(true);
          }}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          aria-label="설치 배너 닫기"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
