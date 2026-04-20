/**
 * 엔티티 타입 정의
 * Prisma 기본 타입과 복합 관계형 타입
 */

import { Prisma } from '@prisma/client';
export type {
  Streamer,
  Schedule,
  Game,
  ScheduleParticipant,
  User,
  Feedback,
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
 * 피드백 + 스트리머 정보
 */
export type FeedbackWithStreamer = Prisma.FeedbackGetPayload<{
  include: {
    streamer: true;
  };
}>;

/**
 * 사용자 + 계정 정보
 */
export type UserWithAccounts = Prisma.UserGetPayload<{
  include: {
    accounts: true;
    sessions: true;
  };
}>;
