/**
 * 모델 및 DTO 타입 정의
 * 폼 데이터, 요청/응답 모델
 */

import type { Schedule, Streamer, Game } from '@prisma/client';
import type { ScheduleWithRelations } from './entities';

/**
 * 스케줄 생성 폼 데이터
 */
export interface CreateScheduleInput {
  title: string;
  content?: string;
  startTime: Date;
  endTime?: Date;
  streamerIds: string[];
  gameId?: string;
  isGuerrilla?: boolean;
}

/**
 * 스케줄 수정 폼 데이터
 */
export interface UpdateScheduleInput extends Partial<CreateScheduleInput> {
  id: string;
}

/**
 * 스트리머 생성 폼 데이터
 */
export interface CreateStreamerInput {
  name: string;
  handle: string;
  generation: number;
  role?: string;
  platform?: string;
  profileImg?: string;
  colorCode?: string;
  chzzkUrl?: string;
}

/**
 * 스트리머 수정 폼 데이터
 */
export interface UpdateStreamerInput extends Partial<CreateStreamerInput> {
  id: string;
}

/**
 * 피드백 폼 데이터
 */
export interface CreateFeedbackInput {
  type: 'EDIT_REQUEST' | 'GENERAL';
  category: string;
  content: string;
  streamerId?: string;
  streamerName?: string;
}

/**
 * 평탄화된 스케줄 DTO (UI 렌더링용)
 */
export interface FlattenedScheduleDTO {
  id: string;
  title: string;
  content?: string;
  startTime: Date;
  endTime: Date | null;
  createdAt: Date;
  isGuerrilla: boolean;

  // 확장된 정보
  participants: Streamer[];
  game?: Game | null;

  // 포맷된 문자열
  formattedDate: string;
  formattedTime: string;
  formattedEndTime?: string;
}

/**
 * 스트리머 카드 DTO
 */
export interface StreamerCardDTO extends Streamer {
  scheduleCount: number;
  upcomingSchedules: FlattenedScheduleDTO[];
}

/**
 * 페이지네이션 쿼리
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 날짜 범위 쿼리
 */
export interface DateRangeQuery {
  startDate: Date;
  endDate: Date;
}

/**
 * 필터 옵션
 */
export interface ScheduleFilterOptions {
  streamerId?: string;
  gameId?: string;
  isGuerrilla?: boolean;
  dateRange?: DateRangeQuery;
  search?: string;
}

/**
 * 클립 생성 폼 데이터
 */
export interface CreateClipInput {
  title: string;
  url: string;
  thumbnailUrl?: string;
  description?: string;
  clipDate?: Date;
  streamerIds: string[];
  scheduleId?: string;
}

/**
 * 클립 수정 폼 데이터
 */
export interface UpdateClipInput extends Partial<CreateClipInput> {
  id: string;
}
