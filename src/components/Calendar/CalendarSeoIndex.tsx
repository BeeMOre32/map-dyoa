import Link from 'next/link';
import { addDays, subDays } from 'date-fns';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';
import JsonLd from '@/components/Seo/JsonLd';
import { getCalendarItemListJsonLd } from '@/lib/seo-jsonld';

type Props = {
  schedules: FlattenedSchedule[];
};

/** unstable_cache·직렬화 후 startTime이 string일 수 있음 */
function scheduleStartMs(startTime: FlattenedSchedule['startTime']): number {
  return new Date(startTime).getTime();
}

function formatScheduleLine(schedule: FlattenedSchedule) {
  const dateLabel = format(new Date(schedule.startTime), 'M월 d일 (EEE)', {
    locale: ko,
  });
  const timeLabel = schedule.isGuerrilla ? '시간 미정' : schedule.formattedTime;
  const members = schedule.participants.map((p) => p.name).join(', ');
  const game = schedule.game?.title;
  return { dateLabel, timeLabel, members, game };
}

export default function CalendarSeoIndex({ schedules }: Props) {
  const now = new Date();
  const upcomingEnd = addDays(now, 45);
  const recentStart = subDays(now, 30);

  const nowMs = now.getTime();
  const upcomingEndMs = upcomingEnd.getTime();
  const recentStartMs = recentStart.getTime();

  const upcoming = schedules
    .filter((s) => {
      const t = scheduleStartMs(s.startTime);
      return t >= nowMs && t <= upcomingEndMs;
    })
    .slice(0, 40);

  const recent = schedules
    .filter((s) => {
      const t = scheduleStartMs(s.startTime);
      return t >= recentStartMs && t < nowMs;
    })
    .sort((a, b) => scheduleStartMs(b.startTime) - scheduleStartMs(a.startTime))
    .slice(0, 20);

  const indexSchedules = [...upcoming, ...recent].slice(0, 80);

  return (
    <section
      aria-label="지도동 방송 일정 목록"
      className="sr-only"
    >
      <JsonLd
        data={getCalendarItemListJsonLd(
          indexSchedules,
          '지도동 방송 일정 — 예정 및 최근',
        )}
      />
      <h2>지도동 방송 일정 목록</h2>
      <p>지도동 멤버 방송·게임 일정 (예정·최근)</p>

      {upcoming.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
            예정 일정
          </h3>
          <ul className="mt-2 space-y-2">
            {upcoming.map((schedule) => {
              const { dateLabel, timeLabel, members, game } =
                formatScheduleLine(schedule);
              return (
                <li key={schedule.id}>
                  <Link href={`/calendar/schedule/${schedule.id}`}>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {schedule.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                      {dateLabel} · {timeLabel}
                      {members ? ` · ${members}` : ''}
                      {game ? ` · ${game}` : ''}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {recent.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">
            최근 일정
          </h3>
          <ul className="mt-2 space-y-2">
            {recent.map((schedule) => {
              const { dateLabel, timeLabel, members } = formatScheduleLine(schedule);
              return (
                <li key={schedule.id}>
                  <Link href={`/calendar/schedule/${schedule.id}`}>
                    <span className="font-semibold">{schedule.title}</span>
                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                      {dateLabel} · {timeLabel}
                      {members ? ` · ${members}` : ''}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
