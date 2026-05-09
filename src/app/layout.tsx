// src/app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import AuthProvider from '@/providers/AuthProvider';
import Header from '@/components/Layout/Header';
import AnnouncementBanner from '@/components/Layout/AnnouncementBanner';
import HelpToast from '@/components/Common/HelpToast';
import AnnouncementToast from '@/components/Common/AnnouncementToast';
import { ToastProvider } from '@/components/Common/Toaster';
import PwaRegistrar from '@/components/Common/PwaRegistrar';
import PwaInstallBanner from '@/components/Common/PwaInstallBanner';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ThemeProvider } from '@/providers/ThemeProvider';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Map-Dyoa | 지도동 일정 관리',
  description: '지도동 멤버들의 방송 일정을 한눈에 확인하세요.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/brand/map-dyoa-logo.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/brand/map-dyoa-logo.svg' }],
    shortcut: ['/favicon.svg'],
  },
  openGraph: {
    title: 'Map-Dyoa | 지도동 일정 관리',
    description: '지도동 멤버들의 방송 일정을 한눈에 확인하세요.',
    images: ['/og-image.svg'],
    type: 'website',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Map-Dyoa | 지도동 일정 관리',
    description: '지도동 멤버들의 방송 일정을 한눈에 확인하세요.',
    images: ['/og-image.svg'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${inter.className} antialiased text-slate-900 dark:text-slate-100 transition-colors duration-300`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <PwaRegistrar />
              <PwaInstallBanner />
              <main className="h-dvh w-full bg-slate-50/50 dark:bg-slate-950 flex flex-col overflow-hidden transition-colors duration-300">
                <Header />
                <AnnouncementBanner />
                <div className="flex-1 flex flex-col overflow-y-auto sm:overflow-hidden">
                  {children}
                </div>
                <AnnouncementToast />
                <HelpToast />
              </main>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
