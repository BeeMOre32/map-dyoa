import {
  endOfMonth,
  format,
  isSameMonth,
  isValid,
  startOfMonth,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';

const WEEKDAY_KO = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

export type MonthlyWrappedHighlight = {
  label: string;
  value: string;
  sub?: string;
};

export type MonthlyRankedItem = {
  name: string;
  count: number;
  pct: number;
};

export type MonthlyWeekdayBreakdown = {
  label: string;
  short: string;
  count: number;
  pct: number;
};

export type MonthlyBusyDay = {
  dateKey: string;
  label: string;
  count: number;
};

export type MonthlyTimeBucket = {
  label: string;
  count: number;
  pct: number;
};

export type MonthlyWrappedStats = {
  scheduleCount: number;
  activeDays: number;
  uniqueStreamers: number;
  guerrillaCount: number;
  naejeonCount: number;
  topStreamer: MonthlyWrappedHighlight | null;
  topGame: MonthlyWrappedHighlight | null;
  busiestDay: MonthlyWrappedHighlight | null;
  busiestWeekday: MonthlyWrappedHighlight | null;
  highlights: MonthlyWrappedHighlight[];
  topStreamersRanked: MonthlyRankedItem[];
  topGamesRanked: MonthlyRankedItem[];
  weekdayBreakdown: MonthlyWeekdayBreakdown[];
  avgSchedulesPerActiveDay: number;
  avgParticipantsPerSchedule: number;
  collabCount: number;
  soloCount: number;
  withGameCount: number;
  withoutGameCount: number;
  liveEndedCount: number;
  guestAppearanceCount: number;
  weekendCount: number;
  weekdayCount: number;
  uniqueGamesPlayed: number;
  busiestDaysRanked: MonthlyBusyDay[];
  timeBuckets: MonthlyTimeBucket[];
  detailHighlights: MonthlyWrappedHighlight[];
};

const WEEKDAY_SHORT = ['일', '월', '화', '수', '목', '금', '토'];

function toRankedList(
  entries: { name: string; count: number }[],
  limit = 5,
): MonthlyRankedItem[] {
  const sorted = [...entries].sort((a, b) => b.count - a.count).slice(0, limit);
  const max = sorted[0]?.count ?? 0;
  return sorted.map((entry) => ({
    name: entry.name,
    count: entry.count,
    pct: max > 0 ? Math.round((entry.count / max) * 100) : 0,
  }));
}

function topEntry<T extends { count: number }>(
  map: Map<string, T>,
  toHighlight: (entry: T) => MonthlyWrappedHighlight,
): MonthlyWrappedHighlight | null {
  let best: T | null = null;
  for (const entry of map.values()) {
    if (!best || entry.count > best.count) best = entry;
  }
  return best ? toHighlight(best) : null;
}

export function computeMonthlyWrappedStats(
  schedulesByDate: Map<string, FlattenedSchedule[]>,
  month: Date,
): MonthlyWrappedStats {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  const streamerCounts = new Map<string, { name: string; count: number }>();
  const gameCounts = new Map<string, { title: string; count: number }>();
  const dayCounts = new Map<string, number>();
  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];

  let scheduleCount = 0;
  let activeDays = 0;
  let guerrillaCount = 0;
  let naejeonCount = 0;
  let collabCount = 0;
  let soloCount = 0;
  let withGameCount = 0;
  let withoutGameCount = 0;
  let liveEndedCount = 0;
  let guestAppearanceCount = 0;
  let weekendCount = 0;
  let weekdayCount = 0;
  let totalParticipantSlots = 0;
  const uniqueStreamerIds = new Set<string>();
  const uniqueGameIds = new Set<string>();
  const timeBucketCounts = [0, 0, 0, 0]; // 새벽·오전·오후·저녁

  schedulesByDate.forEach((list, dateKey) => {
    const day = new Date(`${dateKey}T12:00:00`);
    if (!isValid(day) || !isSameMonth(day, month) || day < monthStart || day > monthEnd) {
      return;
    }
    if (list.length === 0) return;

    activeDays += 1;
    dayCounts.set(dateKey, list.length);
    weekdayCounts[day.getDay()] += list.length;

    for (const schedule of list) {
      scheduleCount += 1;
      if (schedule.isGuerrilla) guerrillaCount += 1;
      if (schedule.isNaeJeon) naejeonCount += 1;
      if (schedule.isLiveEnded) liveEndedCount += 1;
      if (schedule.game) {
        withGameCount += 1;
        uniqueGameIds.add(schedule.game.id);
      } else {
        withoutGameCount += 1;
      }

      const members = schedule.participants.filter((p) => !p.isGuest);
      const guests = schedule.participants.filter((p) => p.isGuest);
      guestAppearanceCount += guests.length;
      totalParticipantSlots += members.length;
      if (members.length >= 2) collabCount += 1;
      else if (members.length === 1) soloCount += 1;

      const dayOfWeek = day.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) weekendCount += 1;
      else weekdayCount += 1;

      const hour = new Date(schedule.startTime).getHours();
      if (hour >= 0 && hour < 6) timeBucketCounts[0] += 1;
      else if (hour < 12) timeBucketCounts[1] += 1;
      else if (hour < 18) timeBucketCounts[2] += 1;
      else timeBucketCounts[3] += 1;

      for (const participant of schedule.participants) {
        uniqueStreamerIds.add(participant.id);
        const current = streamerCounts.get(participant.id);
        if (current) current.count += 1;
        else streamerCounts.set(participant.id, { name: participant.name, count: 1 });
      }

      if (schedule.game) {
        const current = gameCounts.get(schedule.game.id);
        if (current) current.count += 1;
        else {
          gameCounts.set(schedule.game.id, {
            title: schedule.game.title,
            count: 1,
          });
        }
      }
    }
  });

  const topStreamer = topEntry(streamerCounts, (e) => ({
    label: 'TOP 멤버',
    value: e.name,
    sub: `${e.count}회 출연`,
  }));

  const topGame = topEntry(gameCounts, (e) => ({
    label: 'TOP 게임',
    value: e.title,
    sub: `${e.count}회 일정`,
  }));

  let busiestDay: MonthlyWrappedHighlight | null = null;
  let busiestDayCount = 0;
  dayCounts.forEach((count, dateKey) => {
    if (count <= busiestDayCount) return;
    busiestDayCount = count;
    const day = new Date(`${dateKey}T12:00:00`);
    busiestDay = {
      label: '가장 바쁜 날',
      value: format(day, 'M월 d일', { locale: ko }),
      sub: `${count}개 일정`,
    };
  });

  let busiestWeekdayIndex = -1;
  let busiestWeekdayCount = 0;
  weekdayCounts.forEach((count, idx) => {
    if (count > busiestWeekdayCount) {
      busiestWeekdayCount = count;
      busiestWeekdayIndex = idx;
    }
  });

  const busiestWeekday =
    busiestWeekdayIndex >= 0 && busiestWeekdayCount > 0
      ? {
          label: '요일 패턴',
          value: WEEKDAY_KO[busiestWeekdayIndex],
          sub: `${busiestWeekdayCount}회 일정`,
        }
      : null;

  const highlights: MonthlyWrappedHighlight[] = [
    topStreamer,
    topGame,
    busiestDay,
    busiestWeekday,
    {
      label: '참여 멤버',
      value: `${uniqueStreamerIds.size}명`,
      sub: '이번 달 등장',
    },
    {
      label: '일정 있는 날',
      value: `${activeDays}일`,
      sub: `${monthEnd.getDate()}일 중`,
    },
  ].filter((h): h is MonthlyWrappedHighlight => h != null);

  if (guerrillaCount > 0) {
    highlights.push({
      label: '게릴라',
      value: `${guerrillaCount}회`,
      sub: '시간 미정 포함',
    });
  }

  if (naejeonCount > 0) {
    highlights.push({
      label: '내전',
      value: `${naejeonCount}회`,
    });
  }

  const topStreamersRanked = toRankedList(
    [...streamerCounts.values()].map((e) => ({ name: e.name, count: e.count })),
  );

  const topGamesRanked = toRankedList(
    [...gameCounts.values()].map((e) => ({ name: e.title, count: e.count })),
  );

  const weekdayMax = Math.max(...weekdayCounts, 0);
  const weekdayBreakdown: MonthlyWeekdayBreakdown[] = weekdayCounts.map((count, idx) => ({
    label: WEEKDAY_KO[idx],
    short: WEEKDAY_SHORT[idx],
    count,
    pct: weekdayMax > 0 ? Math.round((count / weekdayMax) * 100) : 0,
  }));

  const busiestDaysRanked: MonthlyBusyDay[] = [...dayCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([dateKey, count]) => {
      const day = new Date(`${dateKey}T12:00:00`);
      return {
        dateKey,
        label: format(day, 'M월 d일 (EEE)', { locale: ko }),
        count,
      };
    });

  const bucketLabels = ['새벽 (0–6시)', '오전 (6–12시)', '오후 (12–18시)', '저녁 (18–24시)'];
  const bucketMax = Math.max(...timeBucketCounts, 0);
  const timeBuckets: MonthlyTimeBucket[] = bucketLabels.map((label, idx) => ({
    label,
    count: timeBucketCounts[idx],
    pct: bucketMax > 0 ? Math.round((timeBucketCounts[idx] / bucketMax) * 100) : 0,
  }));

  const avgSchedulesPerActiveDay =
    activeDays > 0 ? Math.round((scheduleCount / activeDays) * 10) / 10 : 0;
  const avgParticipantsPerSchedule =
    scheduleCount > 0 ? Math.round((totalParticipantSlots / scheduleCount) * 10) / 10 : 0;

  const detailHighlights: MonthlyWrappedHighlight[] = [
    {
      label: '하루 평균',
      value: `${avgSchedulesPerActiveDay}개`,
      sub: '일정 있는 날 기준',
    },
    {
      label: '평균 참여',
      value: `${avgParticipantsPerSchedule}명`,
      sub: '합방당 멤버',
    },
    {
      label: '합방 / 솔로',
      value: `${collabCount} / ${soloCount}`,
      sub: '2인 이상 · 1인',
    },
    {
      label: '게임 연결',
      value: `${withGameCount}개`,
      sub: `${uniqueGameIds.size}종 플레이`,
    },
    {
      label: '주말 / 평일',
      value: `${weekendCount} / ${weekdayCount}`,
      sub: '토·일 · 월–금',
    },
    {
      label: '게스트',
      value: `${guestAppearanceCount}회`,
      sub: '게스트 출연',
    },
  ];

  if (liveEndedCount > 0) {
    detailHighlights.push({
      label: '종료 처리',
      value: `${liveEndedCount}개`,
      sub: '방송 종료 표시',
    });
  }

  return {
    scheduleCount,
    activeDays,
    uniqueStreamers: uniqueStreamerIds.size,
    guerrillaCount,
    naejeonCount,
    topStreamer,
    topGame,
    busiestDay,
    busiestWeekday,
    highlights,
    topStreamersRanked,
    topGamesRanked,
    weekdayBreakdown,
    avgSchedulesPerActiveDay,
    avgParticipantsPerSchedule,
    collabCount,
    soloCount,
    withGameCount,
    withoutGameCount,
    liveEndedCount,
    guestAppearanceCount,
    weekendCount,
    weekdayCount,
    uniqueGamesPlayed: uniqueGameIds.size,
    busiestDaysRanked,
    timeBuckets,
    detailHighlights,
  };
}
