// src/app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import AuthProvider from '@/providers/AuthProvider';
import Header from '@/components/Layout/Header';
import PromotionToastStack from '@/components/Common/PromotionToastStack';
import { ToastProvider } from '@/components/Common/Toaster';
import PwaRegistrar from '@/components/Common/PwaRegistrar';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ThemeProvider } from '@/providers/ThemeProvider';
import MotionProvider from '@/providers/MotionProvider';
import { APP_THEME } from '@/config/theme';
import { getOrganizationJsonLd, getRootMetadata, getWebsiteJsonLd } from '@/lib/site';
import { getTheme } from '@teispace/next-themes/server';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = getRootMetadata();

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialTheme = await getTheme({
    cookieName: APP_THEME.storageKey,
    themes: [...APP_THEME.themes, 'system'],
  });
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${inter.className} antialiased text-slate-900 dark:text-slate-100 transition-colors duration-300`}
        suppressHydrationWarning
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getWebsiteJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getOrganizationJsonLd()) }}
        />
        <ThemeProvider initialTheme={initialTheme ?? undefined}>
          <MotionProvider>
            <AuthProvider>
              <ToastProvider>
                <PwaRegistrar />
                <main className="h-dvh w-full bg-slate-50/50 dark:bg-slate-950 flex flex-col overflow-hidden transition-colors duration-300">
                  <Header />
                  <div className="flex min-h-0 flex-1 flex-col overflow-y-auto sm:overflow-hidden">
                    {children}
                  </div>
                  <PromotionToastStack />
                </main>
              </ToastProvider>
            </AuthProvider>
          </MotionProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
