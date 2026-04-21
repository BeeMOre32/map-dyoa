// src/app/admin/feedbacks/page.tsx
import { getFeedbacks } from '@/lib/data-fetching';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CheckCircle2, Clock, AlertCircle, MessageSquare } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';

export default async function AdminFeedbackPage() {
  const feedbacks = await getFeedbacks();

  return (
    <div className="p-8 space-y-8 bg-white dark:bg-slate-950 min-h-screen transition-colors">
      {/* 헤더 섹션 */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          수정 요청 관리
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold mt-2">
          사용자들이 보낸 총 {feedbacks.length}건의 피드백이 있습니다.
        </p>
      </div>

      {/* 피드백 리스트 (서버에서 렌더링됨) */}
      <div className="grid gap-4">
        {feedbacks.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-700">
            <p className="text-slate-400 dark:text-slate-500 font-bold">
              도착한 요청이 아직 없습니다. ☕
            </p>
          </div>
        ) : (
          feedbacks.map((item: (typeof feedbacks)[number]) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-800 rounded-4xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm hover:shadow-md dark:hover:shadow-slate-900/50 transition-shadow flex flex-col md:flex-row gap-6 items-start"
            >
              {/* 왼쪽: 상태 및 정보 */}
              <div className="shrink-0 flex flex-col gap-3 min-w-35">
                <StatusBadge status={item.status} />
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700 rounded-2xl border border-slate-100 dark:border-slate-600 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase">
                  {format(new Date(item.createdAt), 'yyyy.MM.dd HH:mm')}
                </div>
              </div>

              {/* 중앙: 상세 내용 */}
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

              {/* 오른쪽: 액션 버튼 (나중에 처리 로직 추가) */}
              <div className="shrink-0 pt-2">
                <button className="px-5 py-2.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors">
                  처리 완료하기
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
