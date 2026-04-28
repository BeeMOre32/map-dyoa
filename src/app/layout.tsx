// src/app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import AuthProvider from '@/providers/AuthProvider';
import Header from '@/components/Layout/Header';
import HelpToast from '@/components/Common/HelpToast';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ThemeProvider } from '@/providers/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Map-Dyoa | 지도동 일정 관리',
  description: '지도동 멤버들의 방송 일정을 한눈에 확인하세요.',
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
            <main className="h-screen w-full bg-slate-50/50 dark:bg-slate-950 flex flex-col overflow-hidden transition-colors duration-300">
              <Header />
              <div className="flex-1 flex flex-col overflow-hidden">
                {children}
              </div>
              <HelpToast />
            </main>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
