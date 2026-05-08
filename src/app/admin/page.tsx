import React from 'react';
import Link from 'next/link';
import { MessageSquare, Users, Calendar, Clapperboard, Bell } from 'lucide-react';
import { auth } from '@/auth';
import { getAdminStats } from '@/lib/data-fetching';

export default async function AdminDashboard() {
  const session = await auth();

  if (session?.user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-md dark:shadow-lg dark:shadow-slate-900/50 text-center border border-slate-100 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            접근 권한이 없습니다
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            관리자만 접근할 수 있는 페이지입니다.
          </p>
        </div>
      </div>
    );
  }

  const { scheduleCount, clipCount, streamerCount, pendingFeedbackCount } = await getAdminStats();

  type StatColor = 'blue' | 'violet' | 'emerald' | 'amber';
  const stats: { label: string; value: number; icon: React.ElementType; color: StatColor; urgent?: boolean }[] = [
    { label: '총 일정', value: scheduleCount, icon: Calendar, color: 'blue' },
    { label: '총 클립', value: clipCount, icon: Clapperboard, color: 'violet' },
    { label: '스트리머', value: streamerCount, icon: Users, color: 'emerald' },
    { label: '미처리 요청', value: pendingFeedbackCount, icon: Bell, color: 'amber', urgent: pendingFeedbackCount > 0 },
  ];

  const colorMap = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', val: 'text-blue-700 dark:text-blue-300' },
    violet: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400', val: 'text-violet-700 dark:text-violet-300' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', val: 'text-emerald-700 dark:text-emerald-300' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', val: 'text-amber-700 dark:text-amber-300' },
  };

  return (
    <div className="p-8 space-y-8 bg-white dark:bg-slate-950 min-h-screen transition-colors">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold mt-2">
          지도동 프로젝트 관리 시스템에 오신 것을 환영합니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, urgent }) => {
          const c = colorMap[color];
          return (
            <div
              key={label}
              className={`bg-white dark:bg-slate-800 p-6 rounded-3xl border shadow-sm transition-all ${
                urgent
                  ? 'border-amber-200 dark:border-amber-800/50'
                  : 'border-slate-100 dark:border-slate-700'
              }`}
            >
              <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${c.text}`} />
              </div>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-wider">
                {label}
              </p>
              <p className={`text-3xl font-black mt-1 ${c.val}`}>{value}</p>
            </div>
          );
        })}
      </div>

      {/* 관리 메뉴 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/admin/feedbacks">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl dark:hover:shadow-slate-900/50 hover:-translate-y-1 transition-all group">
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white">
              수정 요청 관리
            </h3>
            <p className="text-slate-400 dark:text-slate-500 font-bold text-sm mt-2">
              사용자들이 보낸 피드백과 정보 수정 요청을 확인합니다.
            </p>
            {pendingFeedbackCount > 0 && (
              <span className="inline-block mt-4 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full text-xs font-black">
                미처리 {pendingFeedbackCount}건
              </span>
            )}
          </div>
        </Link>

        <Link href="/admin/streamers">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl dark:hover:shadow-slate-900/50 hover:-translate-y-1 transition-all group">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white">
              방송인 관리
            </h3>
            <p className="text-slate-400 dark:text-slate-500 font-bold text-sm mt-2">
              스트리머 정보 추가 및 수정을 진행합니다.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
