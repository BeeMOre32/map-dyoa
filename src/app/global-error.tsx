'use client';

import { useEffect } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import ErrorReportPanel from '@/components/Common/ErrorReportPanel';
import { ToastProvider } from '@/components/Common/Toaster';

const inter = Inter({ subsets: ['latin'] });

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${inter.className} antialiased text-slate-900 dark:text-slate-100`}
        suppressHydrationWarning
      >
        <ToastProvider>
          <ErrorReportPanel error={error} reset={reset} variant="fullscreen" />
        </ToastProvider>
      </body>
    </html>
  );
}
