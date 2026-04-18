// src/app/admin/feedbacks/page.tsx
import { prisma } from '@/src/lib/prisma';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CheckCircle2, Clock, AlertCircle, MessageSquare } from 'lucide-react';
import StatusBadge from '@/src/components/StatusBadge'; // 🌟 2단계에서 만들 컴포넌트

export default async function AdminFeedbackPage() {
  // 1. 서버에서 직접 데이터를 가져옵니다. (No Fetch API!)
  const feedbacks = await prisma.feedback.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-8 space-y-8">
      {/* 헤더 섹션 */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-indigo-600" />
          수정 요청 관리
        </h1>
        <p className="text-slate-500 font-bold mt-2">
          사용자들이 보낸 총 {feedbacks.length}건의 피드백이 있습니다.
        </p>
      </div>

      {/* 피드백 리스트 (서버에서 렌더링됨) */}
      <div className="grid gap-4">
        {feedbacks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-bold">
              도착한 요청이 아직 없습니다. ☕
            </p>
          </div>
        ) : (
          feedbacks.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6 items-start"
            >
              {/* 왼쪽: 상태 및 정보 */}
              <div className="shrink-0 flex flex-col gap-3 min-w-[140px]">
                <StatusBadge status={item.status} id={item.id} />
                <div className="px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] font-black text-slate-400 uppercase">
                  {format(new Date(item.createdAt), 'yyyy.MM.dd HH:mm')}
                </div>
              </div>

              {/* 중앙: 상세 내용 */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black">
                    {item.category}
                  </span>
                  <span className="text-slate-400 font-bold text-sm">
                    Target:{' '}
                    <span className="text-slate-700">
                      {item.streamerName || '전체'}
                    </span>
                  </span>
                </div>
                <p className="text-slate-700 font-bold leading-relaxed whitespace-pre-wrap">
                  {item.content}
                </p>
              </div>

              {/* 오른쪽: 액션 버튼 (나중에 처리 로직 추가) */}
              <div className="shrink-0 pt-2">
                <button className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-colors">
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
