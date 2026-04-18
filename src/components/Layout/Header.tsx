// src/components/layout/Header.tsx
'use client';

import Link from 'next/link';
import { FileQuestionMark, LogIn, LogOut, Map, UserCheck } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="py-4 px-8 border-b bg-white flex justify-between items-center shrink-0">
      <Link href="/" className="flex items-center gap-2 group">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
          <Map className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Map-Dyoa
        </h1>
      </Link>

      <div className="flex items-center gap-6">
        <p className="text-sm text-slate-500 font-medium hidden sm:block">
          우왕 나도 지도동 됴아행
        </p>
        <Link
          href="/help"
          className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl border border-slate-100 transition-all group"
          title="도움말"
        >
          <FileQuestionMark className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </Link>

        {session ? (
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 text-[10px] font-black uppercase">
              <UserCheck className="w-3 h-3" /> Admin
            </div>

            <button
              onClick={() => signOut()}
              className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl border border-slate-100 transition-all group"
              title="로그아웃"
            >
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-slate-100 transition-all group"
            title="관리자 로그인"
          >
            <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </Link>
        )}
      </div>
    </header>
  );
}
