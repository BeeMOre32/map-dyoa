/**
 * 엔티티 타입 정의
 * Prisma 기본 타입과 복합 관계형 타입
 */

import { Prisma, Streamer } from '@prisma/client';
export type {
  Streamer,
  Schedule,
  Game,
  ScheduleParticipant,
  User,
  Feedback,
  Clip,
  ClipParticipant,
} from '@prisma/client';

/**
 * 스케줄 + 참여자(스트리머 정보 포함) + 게임
 */
export type ScheduleWithRelations = Prisma.ScheduleGetPayload<{
  include: {
    participants: {
      include: {
        streamer: true;
      };
    };
    game: true;
  };
}>;

/**
 * 스트리머 + 참여한 스케줄 목록
 */
export type StreamerWithSchedules = Prisma.StreamerGetPayload<{
  include: {
    schedules: {
      include: {
        schedule: {
          include: {
            game: true;
          };
        };
      };
    };
  };
}>;

/**
 * 스케줄 + 참여자(스트리머 정보 포함, 게임 제외)
 */
export type ScheduleWithParticipants = Prisma.ScheduleGetPayload<{
  include: {
    participants: {
      include: {
        streamer: true;
      };
    };
  };
}>;

/**
 * 스케줄 + 게임 + 참여자(Streamer 배열)
 */
export type ScheduleWithDetails = Omit<
  Prisma.ScheduleGetPayload<{
    include: {
      game: true;
    };
  }>,
  'participants'
> & {
  participants: Streamer[];
};

/**
 * 사용자 + 계정 정보
 */
export type UserWithAccounts = Prisma.UserGetPayload<{
  include: {
    accounts: true;
    sessions: true;
  };
}>;

/**
 * 클립 + 참여 스트리머 목록 + 연결된 방송 일정
 */
export type ClipWithParticipants = Prisma.ClipGetPayload<{
  include: {
    participants: { include: { streamer: true } };
    schedule: {
      select: {
        id: true;
        title: true;
        game: { select: { id: true; title: true } };
      };
    };
  };
}>;
