// src/app/admin/page.tsx
import Link from 'next/link';
import { MessageSquare, Users } from 'lucide-react';
import { auth } from '@/src/auth';

export default async function AdminDashboard() {
  const session = await auth();

  if (session?.user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            접근 권한이 없습니다
          </h2>
          <p className="text-slate-500">
            관리자만 접근할 수 있는 페이지입니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-slate-500 font-bold mt-2">
          지도동 프로젝트 관리 시스템에 오신 것을 환영합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 수정 요청 관리 카드 */}
        <Link href="/admin/feedbacks">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-7 h-7 text-indigo-600" />
            </div>
            <h3 className="text-xl font-black text-slate-800">
              수정 요청 관리
            </h3>
            <p className="text-slate-400 font-bold text-sm mt-2">
              사용자들이 보낸 피드백과 정보 수정 요청을 확인합니다.
            </p>
          </div>
        </Link>

        {/* 다른 관리 메뉴들 (나중에 구현) */}
        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-dashed border-slate-200 opacity-60">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6">
            <Users className="w-7 h-7 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-400">방송인 관리</h3>
          <p className="text-slate-300 font-bold text-sm mt-2">준비 중...</p>
        </div>
      </div>
    </div>
  );
}
