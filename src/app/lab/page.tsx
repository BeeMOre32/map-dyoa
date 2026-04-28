import { getCalendarData } from '@/lib/data-fetching';
import { FlaskConical, LayoutGrid, ExternalLink, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

export const metadata = {
  title: '실험실 | Map-Dyoa',
  description: '개발 중인 기능을 미리 체험해보세요.',
};

export default async function LabPage() {
  const { schedules } = await getCalendarData();

  const multiviewCandidates = schedules
    .filter((s) => s.participants.length >= 2)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 8);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Navigation />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-xl mx-auto space-y-6 pb-6">

          {/* 헤더 */}
          <div className="flex items-center gap-4 pt-2">
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-3xl flex items-center justify-center shadow-sm">
              <FlaskConical className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">실험실</h1>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  BETA
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                개발 중인 기능을 미리 체험하고 피드백을 남겨주세요
              </p>
            </div>
          </div>

          {/* 멀티뷰 기능 카드 */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* 카드 헤더 */}
            <div className="p-5 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl shrink-0">
                  <LayoutGrid className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-slate-800 dark:text-white">
                      멀티뷰 시청
                    </h2>
                    <span className="text-[9px] font-black px-1.5 py-px rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-500 dark:text-indigo-400">
                      NEW
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-relaxed">
                    여러 스트리머의 방송을 한 화면에서 동시에 시청할 수 있어요.
                    스케줄을 선택하면 새 탭에서 멀티뷰가 열립니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 스케줄 목록 */}
            <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {multiviewCandidates.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-slate-400 dark:text-slate-500 font-bold">
                    체험 가능한 다인 방송 일정이 없습니다
                  </p>
                </div>
              ) : (
                multiviewCandidates.map((schedule) => (
                  <Link
                    key={schedule.id}
                    href={`/calendar/schedule/${schedule.id}/multiview`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    {/* 참여자 수 뱃지 */}
                    <span className="shrink-0 w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 text-[11px] font-black flex items-center justify-center">
                      {schedule.participants.length}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {schedule.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                          {format(new Date(schedule.startTime), 'yyyy년 M월 d일', { locale: ko })}
                        </span>
                        <span className="text-slate-200 dark:text-slate-700">·</span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                          {schedule.participants.map((p) => p.name).join(', ')}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1 text-xs font-black text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">체험하기</span>
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* 카드 푸터 */}
            <div className="px-5 py-3.5 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-50 dark:border-slate-800">
              <Link
                href="/calendar"
                className="flex items-center gap-1.5 text-xs font-black text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors group"
              >
                스케줄 전체 보기
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* 피드백 안내 */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
            <FlaskConical className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
              실험실의 기능은 아직 개발 중이며 불안정할 수 있습니다.
              오류나 개선 아이디어는 언제든지 환영합니다 :)
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
