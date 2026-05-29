import React from 'react';
import Link from 'next/link';
import {
  MessageSquare, Users, Calendar, Clapperboard, Bell,
  Gamepad2, Clock, Film, Megaphone,
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { auth } from '@/auth';
import { getAdminStats, getRecentActivity } from '@/lib/data-fetching';

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

  const [
    { scheduleCount, clipCount, streamerCount, pendingFeedbackCount },
    { schedules: recentSchedules, clips: recentClips },
  ] = await Promise.all([getAdminStats(), getRecentActivity()]);

  type StatColor = 'blue' | 'violet' | 'emerald' | 'amber';
  const stats: { label: string; value: number; icon: React.ElementType; color: StatColor; href?: string; urgent?: boolean }[] = [
    { label: '총 일정', value: scheduleCount, icon: Calendar, color: 'blue', href: '/admin/schedules' },
    { label: '총 클립', value: clipCount, icon: Clapperboard, color: 'violet', href: '/admin/clips' },
    { label: '스트리머', value: streamerCount, icon: Users, color: 'emerald', href: '/admin/streamers' },
    { label: '미처리 요청', value: pendingFeedbackCount, icon: Bell, color: 'amber', href: '/admin/feedbacks', urgent: pendingFeedbackCount > 0 },
  ];

  const colorMap = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', val: 'text-blue-700 dark:text-blue-300' },
    violet: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400', val: 'text-violet-700 dark:text-violet-300' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', val: 'text-emerald-700 dark:text-emerald-300' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', val: 'text-amber-700 dark:text-amber-300' },
  };

  const recentItems = [
    ...recentSchedules.map((s) => ({
      id: s.id,
      type: 'schedule' as const,
      title: s.title,
      sub: s.game?.title ?? '기타 방송',
      date: s.createdAt,
      href: `/calendar/schedule/${s.id}`,
    })),
    ...recentClips.map((c) => ({
      id: c.id,
      type: 'clip' as const,
      title: c.title,
      sub: c.participants.map((p) => p.streamer.name).join(', '),
      date: c.createdAt,
      href: `/clips`,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  return (
    <div className="p-8 space-y-8 bg-white dark:bg-slate-950 transition-colors">
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
        {stats.map(({ label, value, icon: Icon, color, href, urgent }) => {
          const c = colorMap[color];
          const inner = (
            <div
              className={`bg-white dark:bg-slate-800 p-6 rounded-3xl border shadow-sm transition-all ${
                urgent
                  ? 'border-amber-200 dark:border-amber-800/50 ring-1 ring-amber-200 dark:ring-amber-800/50'
                  : 'border-slate-100 dark:border-slate-700'
              } ${href ? 'hover:shadow-md hover:-translate-y-0.5' : ''}`}
            >
              <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${c.text}`} />
              </div>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-wider">
                {label}
              </p>
              <p className={`text-3xl font-black mt-1 ${c.val}`}>{value}</p>
              {urgent && (
                <p className="text-xs font-black text-amber-500 mt-2 animate-pulse">클릭하여 처리 →</p>
              )}
            </div>
          );
          return href ? (
            <Link key={label} href={href}>{inner}</Link>
          ) : (
            <div key={label}>{inner}</div>
          );
        })}
      </div>

      {/* 관리 메뉴 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            href: '/admin/notices',
            bg: 'bg-red-50 dark:bg-red-900/20',
            iconColor: 'text-red-600 dark:text-red-400',
            icon: Megaphone,
            title: '긴급 공지',
            desc: '서버 장애·점검 등 사이트 상단 배너 공지를 추가/관리합니다.',
            badge: null,
          },
          {
            href: '/admin/feedbacks',
            bg: 'bg-indigo-50 dark:bg-indigo-900/20',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
            icon: MessageSquare,
            title: '수정 요청 관리',
            desc: '사용자들이 보낸 피드백과 정보 수정 요청을 확인합니다.',
            badge: pendingFeedbackCount > 0 ? `미처리 ${pendingFeedbackCount}건` : null,
          },
          {
            href: '/admin/streamers',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            icon: Users,
            title: '방송인 관리',
            desc: '스트리머 정보 추가 및 수정을 진행합니다.',
            badge: null,
          },
          {
            href: '/admin/games',
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            iconColor: 'text-amber-600 dark:text-amber-400',
            icon: Gamepad2,
            title: '게임 관리',
            desc: '일정에 사용되는 게임 목록을 추가/수정/삭제합니다.',
            badge: null,
          },
          {
            href: '/admin/clips',
            bg: 'bg-violet-50 dark:bg-violet-900/20',
            iconColor: 'text-violet-600 dark:text-violet-400',
            icon: Film,
            title: '클립 관리',
            desc: '등록된 전체 클립을 조회하고 삭제합니다.',
            badge: null,
          },
          {
            href: '/admin/schedules',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            iconColor: 'text-blue-600 dark:text-blue-400',
            icon: Calendar,
            title: '일정 관리',
            desc: '날짜 범위로 일정을 조회하고 삭제합니다.',
            badge: null,
          },
          {
            href: '/admin/audit',
            bg: 'bg-slate-100 dark:bg-slate-800',
            iconColor: 'text-slate-600 dark:text-slate-300',
            icon: Clock,
            title: '변경 이력',
            desc: '일정·클립 등 누가 언제 무엇을 바꿨는지 확인합니다.',
            badge: null,
          },
        ].map(({ href, bg, iconColor, icon: Icon, title, desc, badge }) => (
          <Link key={href} href={href}>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl dark:hover:shadow-slate-900/50 hover:-translate-y-1 transition-all group">
              <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-7 h-7 ${iconColor}`} />
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white">{title}</h3>
              <p className="text-slate-400 dark:text-slate-500 font-bold text-sm mt-2">{desc}</p>
              {badge && (
                <span className="inline-block mt-4 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full text-xs font-black">
                  {badge}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* 최근 활동 피드 */}
      <div>
        <h2 className="text-lg font-black text-slate-800 dark:text-white mb-4">최근 추가된 항목</h2>
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden">
          {recentItems.length === 0 ? (
            <p className="p-6 text-sm text-slate-400 font-bold text-center">항목이 없습니다.</p>
          ) : (
            recentItems.map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                href={item.href}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  item.type === 'schedule'
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'bg-violet-50 dark:bg-violet-900/20'
                }`}>
                  {item.type === 'schedule'
                    ? <Calendar className="w-4 h-4 text-blue-500" />
                    : <Film className="w-4 h-4 text-violet-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{item.title}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate">{item.sub}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 font-medium shrink-0">
                  <Clock className="w-3 h-3" />
                  {format(new Date(item.date), 'M/d HH:mm', { locale: ko })}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
