// src/types/index.ts (또는 기존에 쓰시던 파일명)

import { Game, Prisma, Schedule, Streamer } from '@prisma/client';

// ----------------------------------------------------
// 1. 기본 타입 다시 내보내기 (Re-export)
// Prisma가 이미 만들어둔 기본 타입들을 그대로 가져와서 내보냅니다.
// ----------------------------------------------------
export type {
  Streamer,
  Schedule,
  Game,
  ScheduleParticipant,
} from '@prisma/client';

// ----------------------------------------------------
// 2. 복잡한 관계형 타입 정의 (GetPayload 마법 활용 ✨)
// ----------------------------------------------------

/**
 * 스케줄 + 참여자(스트리머 정보 포함)
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
 * 스케줄 + 참여자 + 게임 정보 (가장 정보가 많은 캘린더용 상세 타입)
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
 * 스트리머 + 참여한 스케줄 목록
 */
export type StreamerWithSchedules = Prisma.StreamerGetPayload<{
  include: {
    schedules: true;
  };
}>;

// ============================================================
// 3. 컴포넌트 Props 및 Form 타입 정의
// ============================================================

/**
 * 피드백 양식 데이터
 */
export type FeedbackForm = {
  streamerId: string;
  streamerName: string;
  category: string;
  content: string;
};

/**
 * API 응답 형식 (공통 사용)
 */
export type ApiResponse<T = any> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * 모달 공통 Props
 */
export type ModalProps = {
  onClose: () => void;
};

/**
 * 캘린더 뷰 Props
 */
export type CalendarViewProps = {
  initialSchedules: Schedule[];
  streamers: Streamer[];
  games: Game[];
};

/**
 * 스트리머 세부정보 Props
 */
export type StreamerDetailProps = {
  streamer: Streamer & {
    schedules: Schedule[];
  };
};

/**
 * 일정 상세정보 Props
 */
export type ScheduleDetailProps = {
  schedule: ScheduleWithDetails;
};

/**
 * 캘린더 모달 Props
 */
export type CalendarModalProps = {
  selectedDate: Date;
  schedules: Schedule[];
  streamers: Streamer[];
  games: Game[];
  onClose?: () => void;
};

// ============================================================
// 4. 플래튼 (Flattened) 타입 - 간단한 데이터 구조
// ============================================================

/**
 * 캘린더 표시용 단순화된 일정 정보
 * (깊은 중첩 제거)
 */
export type FlattenedSchedule = {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  gameName?: string;
  streamerIds: string[];
  streamerNames: string[];
  streamerColorCodes: string[];
};
