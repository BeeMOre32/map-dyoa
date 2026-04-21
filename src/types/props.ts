/**
 * 컴포넌트 Props 및 공통 UI 타입 정의
 */

import type { Streamer, Game, Schedule } from '@prisma/client';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';
import type { ScheduleWithDetails } from './entities';

export type ModalProps = {
  onClose: () => void;
};

export type CalendarViewProps = {
  initialSchedules: FlattenedSchedule[];
  streamers: Streamer[];
  games: Game[];
};

export type CalendarModalProps = {
  selectedDate: Date;
  schedules: FlattenedSchedule[];
  streamers: Streamer[];
  games: Game[];
  onClose?: () => void;
};

export type StreamerDetailProps = {
  streamer: Streamer & {
    schedules: Schedule[];
  };
};

export type ScheduleDetailProps = {
  schedule: ScheduleWithDetails;
};

export type FeedbackForm = {
  streamerId: string;
  streamerName: string;
  category: string;
  content: string;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};
