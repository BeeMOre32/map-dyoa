import { isValid } from 'date-fns';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';

export type LiveChannelSnapshot = {
  streamerId: string;
  liveTitle: string;
  openDate: string | null;
  category: string | null;
};

export type TodayLiveMember = {
  id: string;
  name: string;
  colorCode: string;
  profileImg: string | null;
  live: boolean;
};

export type TodayLiveRow = {
  id: string;
  /** 연결된 일정. 없으면 아직 등록 전 라이브 */
  scheduleId: string | null;
  title: string;
  category: string | null;
  startedAt: Date | null;
  collab: boolean;
  members: TodayLiveMember[];
};

type StreamerLike = {
  id: string;
  name: string;
  colorCode: string;
  profileImg: string | null;
  isGuest?: boolean;
};

function parseOpenDate(value: string | null): Date | null {
  if (!value) return null;
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);
  return isValid(date) ? date : null;
}

/** RSC→클라이언트 직렬화 후 Date가 string으로 올 수 있음 */
function toDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  if (typeof value === 'string') return parseOpenDate(value);
  return isValid(value) ? value : null;
}

function toTime(value: Date | string | null | undefined): number {
  return toDate(value)?.getTime() ?? 0;
}

function earliestDate(dates: Array<Date | string | null | undefined>): Date | null {
  const valid = dates.map(toDate).filter((date): date is Date => date != null);
  if (valid.length === 0) return null;
  return valid.reduce((earliest, date) => (date.getTime() < earliest.getTime() ? date : earliest));
}

export function buildTodayLiveRows({
  schedules,
  streamers,
  channels,
  now,
}: {
  schedules: FlattenedSchedule[];
  streamers: StreamerLike[];
  channels: LiveChannelSnapshot[];
  now: Date;
}): TodayLiveRow[] {
  if (channels.length === 0) return [];

  const byId = new Map(streamers.filter((person) => !person.isGuest).map((person) => [person.id, person]));
  const channelById = new Map(channels.map((channel) => [channel.streamerId, channel]));
  const liveIds = new Set(channels.map((channel) => channel.streamerId));
  const consumed = new Set<string>();
  const rows: TodayLiveRow[] = [];

  const ordered = [...schedules].sort((a, b) => toTime(a.startTime) - toTime(b.startTime));
  for (const schedule of ordered) {
    const people = schedule.participants.filter((person) => !person.isGuest);
    const livePeople = people.filter((person) => liveIds.has(person.id) && !consumed.has(person.id));
    if (people.length < 2 || livePeople.length === 0) continue;

    const liveChannel = livePeople
      .map((person) => channelById.get(person.id))
      .find((channel) => channel?.liveTitle);
    for (const person of livePeople) consumed.add(person.id);
    const scheduleStart = toDate(schedule.startTime);

    rows.push({
      id: schedule.id,
      scheduleId: schedule.id,
      title: schedule.title.trim() || liveChannel?.liveTitle || '합방',
      category: schedule.game?.title?.trim() || liveChannel?.category || null,
      startedAt: earliestDate([
        ...livePeople.map((person) => parseOpenDate(channelById.get(person.id)?.openDate ?? null)),
        scheduleStart && now.getTime() >= scheduleStart.getTime() ? scheduleStart : null,
      ]),
      collab: true,
      members: people.map((person) => ({
        id: person.id,
        name: person.name,
        colorCode: person.colorCode,
        profileImg: person.profileImg,
        live: liveIds.has(person.id),
      })),
    });
  }

  for (const channel of channels) {
    if (consumed.has(channel.streamerId)) continue;
    const streamer = byId.get(channel.streamerId);
    if (!streamer) continue;
    const solo = ordered.find((schedule) => {
      const people = schedule.participants.filter((person) => !person.isGuest);
      return people.length < 2 && people.some((person) => person.id === streamer.id);
    });
    const soloStart = toDate(solo?.startTime);
    rows.push({
      id: solo?.id ?? channel.streamerId,
      scheduleId: solo?.id ?? null,
      title: channel.liveTitle || solo?.title?.trim() || `${streamer.name} 방송`,
      category: channel.category || solo?.game?.title?.trim() || null,
      startedAt:
        parseOpenDate(channel.openDate) ??
        (soloStart && now.getTime() >= soloStart.getTime() ? soloStart : null),
      collab: false,
      members: [
        {
          id: streamer.id,
          name: streamer.name,
          colorCode: streamer.colorCode,
          profileImg: streamer.profileImg,
          live: true,
        },
      ],
    });
  }

  return rows.sort((a, b) => toTime(b.startedAt) - toTime(a.startedAt));
}

/** 베타 주간: 켜진 자동 일정은 목록, 방종이 인식되면 목록에서 빠지고 카드로 남는다. */
export function buildBetaDayRows({
  schedules,
  autoScheduleIds,
  streamers,
  channels,
  now,
  includeLive,
}: {
  schedules: FlattenedSchedule[];
  autoScheduleIds: Set<string>;
  streamers: StreamerLike[];
  channels: LiveChannelSnapshot[];
  now: Date;
  includeLive: boolean;
}): { cards: FlattenedSchedule[]; rows: TodayLiveRow[] } {
  const liveRows = includeLive
    ? buildTodayLiveRows({ schedules, streamers, channels, now })
    : [];
  const endedIds = new Set(
    schedules.filter((schedule) => schedule.isLiveEnded).map((schedule) => schedule.id),
  );
  const rows = liveRows
    .filter((row) => row.members.some((member) => member.live))
    .filter((row) => !row.scheduleId || !endedIds.has(row.scheduleId))
    .sort((a, b) => toTime(b.startedAt) - toTime(a.startedAt));
  const listedAutoIds = new Set(
    rows.flatMap((row) =>
      row.scheduleId && autoScheduleIds.has(row.scheduleId) ? [row.scheduleId] : [],
    ),
  );
  const cards = schedules.filter((schedule) => !listedAutoIds.has(schedule.id));
  return { cards, rows };
}
