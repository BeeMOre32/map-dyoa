// src/app/layout.tsx
import Navigation from '@/src/components/Navigation';
import './globals.css';
import { Inter } from 'next/font/google';
import AuthProvider from '@/src/providers/AuthProvider';
import { LogIn } from 'lucide-react';
import Link from 'next/link';
import Header from '@/src/components/Layout/Header';

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
    <html lang="ko">
      <body className={`${inter.className} antialiased text-slate-900`}>
        <AuthProvider>
          <main className="h-screen w-full bg-slate-50/50 flex flex-col overflow-hidden">
            <Header />
            <div className="shrink-0 pt-2">
              <Navigation />
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              {children}
            </div>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
