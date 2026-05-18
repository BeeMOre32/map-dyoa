import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';
import JsonLd from '@/components/Seo/JsonLd';
import {
  getScheduleBreadcrumbJsonLd,
  getScheduleEventJsonLd,
} from '@/lib/seo-jsonld';

type Props = {
  schedule: FlattenedSchedule;
};

export default function ScheduleSeoContent({ schedule }: Props) {
  const start = new Date(schedule.startTime);
  const dateLabel = format(start, 'yyyy년 M월 d일 (EEE)', { locale: ko });
  const timeLabel = schedule.isGuerrilla
    ? '시간 미정 (게릴라)'
    : schedule.formattedTime;
  const members = schedule.participants.map((p) => p.name).join(', ');
  const gameTitle = schedule.game?.title;

  return (
    <article
      className="sr-only"
      aria-label={`${schedule.title} 일정 정보`}
    >
      <JsonLd
        data={[getScheduleEventJsonLd(schedule), getScheduleBreadcrumbJsonLd(schedule)]}
      />
      <h1>{schedule.title}</h1>
      <p>
        지도동 방송 일정 · {dateLabel} · {timeLabel}
        {gameTitle ? ` · ${gameTitle}` : ''}
        {members ? ` · 참여: ${members}` : ''}
      </p>
      {schedule.content?.trim() ? <p>{schedule.content.trim()}</p> : null}
      <nav aria-label="관련 링크">
        <Link href="/calendar">방송 일정 캘린더</Link>
        {schedule.participants.map((p) => (
          <Link key={p.id} href={`/streamers/detail/${p.id}`}>
            {p.name} 프로필
          </Link>
        ))}
      </nav>
    </article>
  );
}
