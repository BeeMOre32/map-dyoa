import { Sword, Clock, Users } from 'lucide-react';
import { getHoi4Leaderboard } from '@/lib/data-fetching';
import { STREAMER_COLORS } from '@/constants/streamercolor';

import { buildPageMetadata } from '@/lib/site';

export const metadata = buildPageMetadata({
  title: 'HOI4 참전 기록',
  description: '지도동 Hearts of Iron 4 내전·참전 기록과 누적 통계를 확인하세요.',
  path: '/hoi4',
});

function getColor(id: string) {
  return STREAMER_COLORS[id]?.light ?? '#673AB7';
}

function formatDate(d: Date | string) {
  const dt = new Date(d);
  return `${dt.getFullYear()}. ${String(dt.getMonth() + 1).padStart(2, '0')}. ${String(dt.getDate()).padStart(2, '0')}`;
}

export default async function Hoi4Page() {
  const { leaderboard, sessions, totalSessions } = await getHoi4Leaderboard();

  if (leaderboard.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="text-center space-y-3 p-8">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-3xl flex items-center justify-center mx-auto">
            <Sword className="w-8 h-8 text-amber-300 dark:text-amber-700" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-bold">아직 HOI4 전적이 없습니다.</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">일정 수정에서 국가를 입력하면 여기에 표시됩니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 transition-colors">

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-amber-500/10 via-orange-500/5 to-transparent dark:from-amber-500/15 dark:via-orange-900/10" />
        <div className="relative px-4 pt-10 pb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 dark:bg-amber-900/40 rounded-3xl mb-4 shadow-lg shadow-amber-500/10">
            <Sword className="w-8 h-8 text-amber-500 dark:text-amber-400" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            HOI4 참전 기록
          </h1>
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500 font-medium">
              <Users className="w-3.5 h-3.5" />
              <span>{leaderboard.length}명 참전</span>
            </div>
            <span className="w-px h-3.5 bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>총 {totalSessions}세션</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-14 space-y-10">

        {/* 스트리머별 플레이 국가 */}
        <section className="space-y-3">
          <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] px-1">
            스트리머 · 플레이 국가
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {leaderboard.map((entry) => {
              const color = getColor(entry.streamer.id);
              return (
                <div
                  key={entry.streamer.id}
                  className="group relative bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors overflow-hidden"
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <div className="pl-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="font-black text-sm leading-none"
                        style={{ color }}
                      >
                        {entry.streamer.name}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tabular-nums">
                        {entry.total}회
                      </span>
                    </div>
                    {entry.nations.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {entry.nations.map((n) => (
                          <span
                            key={n}
                            className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[11px] font-bold border border-amber-100 dark:border-amber-800/40"
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-300 dark:text-slate-600 font-medium">
                        국가 미등록
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 최근 세션 */}
        {sessions.length > 0 && (
          <section className="space-y-3">
            <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] px-1">
              최근 세션
            </p>
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
                >
                  {/* 세션 헤더 */}
                  <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 min-w-0">
                      <Sword className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-sm font-black text-slate-800 dark:text-white truncate">
                        {session.title}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium shrink-0">
                      {formatDate(session.startTime)}
                    </span>
                  </div>

                  {/* 참가자 목록 */}
                  <div className="px-4 py-3 flex flex-wrap gap-2">
                    {session.participants.map((p) => {
                      const c = getColor(p.streamer.id);
                      return (
                        <div
                          key={p.streamer.id}
                          className="flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: c }}
                          />
                          <span
                            className="text-xs font-black leading-none"
                            style={{ color: c }}
                          >
                            {p.streamer.name}
                          </span>
                          {p.nation && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-none">
                              {p.nation}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
