/**
 * 스케줄 데이터 포맷팅 유틸
 * 중복되는 스케줄 포맷팅 로직을 통합
 */

import { Schedule, ScheduleParticipant, Streamer, Game } from '@prisma/client';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * 스케줄과 관계된 모든 데이터를 포함한 타입
 */
export type ScheduleWithRelations = Schedule & {
  participants: (ScheduleParticipant & {
    streamer: Streamer;
  })[];
  game?: Game | null;
};

/**
 * 평탄화된 스케줄 타입 (참여자가 배열로)
 */
export type FlattenedSchedule = Omit<
  Schedule,
  'startTime' | 'endTime' | 'createdAt'
> & {
  startTime: Date;
  endTime: Date | null;
  createdAt: Date;
  participants: Streamer[];
  game?: Game | null;
  formattedDate: string;
  formattedTime: string;
};

/**
 * 단일 스케줄 평탄화
 * ScheduleParticipant 구조를 Streamer 배열로 변환
 */
export function flattenScheduleParticipants(
  schedule: ScheduleWithRelations,
): FlattenedSchedule {
  return {
    id: schedule.id,
    title: schedule.title,
    content: schedule.content,
    gameId: schedule.gameId,
    game: schedule.game,
    isGuerrilla: schedule.isGuerrilla,
    isLiveEnded: schedule.isLiveEnded,
    liveUrl: schedule.liveUrl,
    startTime: new Date(schedule.startTime),
    endTime: schedule.endTime ? new Date(schedule.endTime) : null,
    createdAt: new Date(schedule.createdAt),
    participants: schedule.participants
      .map((p) => p.streamer)
      .filter((s): s is Streamer => s !== null),
    formattedDate: format(
      new Date(schedule.startTime),
      'yyyy년 MM월 dd일(EEEE)',
      { locale: ko },
    ),
    formattedTime: format(new Date(schedule.startTime), 'HH:mm'),
  };
}

/**
 * 복수 스케줄 평탄화
 */
export function flattenSchedules(
  schedules: ScheduleWithRelations[],
): FlattenedSchedule[] {
  return schedules.map(flattenScheduleParticipants);
}

/**
 * 날짜별로 스케줄 분류
 */
export function groupSchedulesByDate(
  schedules: FlattenedSchedule[],
): Map<string, FlattenedSchedule[]> {
  const grouped = new Map<string, FlattenedSchedule[]>();

  schedules.forEach((schedule) => {
    const dateKey = format(schedule.startTime, 'yyyy-MM-dd');
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(schedule);
  });

  // 시간순으로 정렬
  grouped.forEach((schedules) => {
    schedules.sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
  });

  return grouped;
}

/**
 * 스트리머별로 스케줄 분류
 */
export function groupSchedulesByStreamer(
  schedules: FlattenedSchedule[],
): Map<string, FlattenedSchedule[]> {
  const grouped = new Map<string, FlattenedSchedule[]>();

  schedules.forEach((schedule) => {
    schedule.participants.forEach((participant) => {
      const streamerId = participant.id;
      if (!grouped.has(streamerId)) {
        grouped.set(streamerId, []);
      }
      grouped.get(streamerId)!.push(schedule);
    });
  });

  return grouped;
}

/**
 * 특정 날짜의 스케줄만 필터링
 */
export function filterSchedulesByDate(
  schedules: FlattenedSchedule[],
  date: Date,
): FlattenedSchedule[] {
  const dateKey = format(date, 'yyyy-MM-dd');
  return schedules.filter(
    (schedule) => format(schedule.startTime, 'yyyy-MM-dd') === dateKey,
  );
}

/**
 * 특정 스트리머의 스케줄만 필터링
 */
export function filterSchedulesByStreamer(
  schedules: FlattenedSchedule[],
  streamerId: string,
): FlattenedSchedule[] {
  return schedules.filter((schedule) =>
    schedule.participants.some((p) => p.id === streamerId),
  );
}

/**
 * 스케줄 정렬 (시간순)
 */
export function sortSchedulesByTime(
  schedules: FlattenedSchedule[],
): FlattenedSchedule[] {
  return [...schedules].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
}

/**
 * 게릴라 여부로 필터링
 */
export function filterGuerrillas(
  schedules: FlattenedSchedule[],
  isGuerrilla: boolean = true,
): FlattenedSchedule[] {
  return schedules.filter((schedule) => schedule.isGuerrilla === isGuerrilla);
}
