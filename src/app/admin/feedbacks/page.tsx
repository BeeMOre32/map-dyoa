import { getFeedbacks } from '@/lib/data-fetching';
import { format } from 'date-fns';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import ResolveFeedbackButton from '@/components/admin/ResolveFeedbackButton';
import { auth } from '@/auth';

const TABS = [
  { label: '미처리', value: 'PENDING' },
  { label: '완료', value: 'RESOLVED' },
  { label: '거절', value: 'REJECTED' },
] as const;

type Status = (typeof TABS)[number]['value'];

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
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

  const { status: rawStatus } = await searchParams;
  const activeStatus: Status =
    TABS.some((t) => t.value === rawStatus) ? (rawStatus as Status) : 'PENDING';

  const allFeedbacks = await getFeedbacks();
  const filtered = allFeedbacks.filter((f) => f.status === activeStatus);

  const counts = {
    PENDING: allFeedbacks.filter((f) => f.status === 'PENDING').length,
    RESOLVED: allFeedbacks.filter((f) => f.status === 'RESOLVED').length,
    REJECTED: allFeedbacks.filter((f) => f.status === 'REJECTED').length,
  };

  return (
    <div className="p-8 space-y-6 bg-white dark:bg-slate-950 transition-colors">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          수정 요청 관리
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold mt-2">
          총 {allFeedbacks.length}건 · 미처리 {counts.PENDING}건
        </p>
      </div>

      {/* 상태 탭 */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-fit">
        {TABS.map((tab) => {
          const isActive = activeStatus === tab.value;
          return (
            <Link
              key={tab.value}
              href={`/admin/feedbacks?status=${tab.value}`}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-black transition-all ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {tab.label}
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-black ${
                isActive
                  ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
              }`}>
                {counts[tab.value]}
              </span>
            </Link>
          );
        })}
      </div>

      {/* 피드백 리스트 */}
      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-700">
            <p className="text-slate-400 dark:text-slate-500 font-bold">
              {activeStatus === 'PENDING' ? '미처리 요청이 없습니다 ☕' : '항목이 없습니다.'}
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-800 rounded-4xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm hover:shadow-md dark:hover:shadow-slate-900/50 transition-shadow flex flex-col md:flex-row gap-6 items-start"
            >
              <div className="shrink-0 flex flex-col gap-3 min-w-35">
                <StatusBadge status={item.status} />
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700 rounded-2xl border border-slate-100 dark:border-slate-600 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase">
                  {format(new Date(item.createdAt), 'yyyy.MM.dd HH:mm')}
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-black">
                    {item.category}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 font-bold text-sm">
                    Target:{' '}
                    <span className="text-slate-700 dark:text-slate-300">
                      {item.streamerName || '전체'}
                    </span>
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-bold leading-relaxed whitespace-pre-wrap">
                  {item.content}
                </p>
              </div>

              <div className="shrink-0 pt-2">
                <ResolveFeedbackButton
                  feedbackId={item.id}
                  initialStatus={item.status as 'PENDING' | 'RESOLVED' | 'REJECTED'}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
