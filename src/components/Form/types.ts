import { z } from 'zod';
import { ModalProps } from '@/types/props';
export type { Streamer, Game } from '@prisma/client';
import type { Streamer, Game } from '@prisma/client';
import { FlattenedSchedule } from '@/lib/schedule-formatters';

export const slotSchema = z.object({
  title: z.string().min(1, '방송 제목을 입력해주세요.'),
  startTime: z.string().min(1, '시작 시간을 선택해주세요.'),
  streamerIds: z
    .array(z.string())
    .min(1, '참여 멤버를 최소 1명 이상 선택해주세요.'),
});

export const editSchema = z.object({
  title: z.string().min(1, '방송 제목을 입력해주세요.'),
  startTime: z.string().min(1, '시작 시간을 선택해주세요.'),
  streamerIds: z
    .array(z.string())
    .min(1, '참여 멤버를 최소 1명 이상 선택해주세요.'),
});

export type SlotErrors = Partial<
  Record<'title' | 'startTime' | 'streamerIds', string>
>;

export type SlotEntry = {
  key: string;
  title: string;
  startTime: string;
  selectedGameId: string;
  selectedStreamerIds: string[];
  guestStreamerIds: string[];
  liveUrls: string[];
  isTimeTBD: boolean;
  metaLoading: boolean;
  autoFilled: string[];
  errors: SlotErrors;
};

export type EditErrors = Partial<
  Record<keyof z.infer<typeof editSchema> | 'submit', string>
>;

export type ParticipantEntry = { id: string; nation: string; result: string; isGuest: boolean };

export type AutoFillResult = {
  title: string | null;
  category: string | null;
  channelName: string | null;
  matchedStreamerId: string | null;
  matchedStreamerName: string | null;
};

export type CreateScheduleModalProps = ModalProps & {
  streamers: Streamer[];
  games: Game[];
  initialData?: FlattenedSchedule | null;
  isEdit?: boolean;
  /** 일정 상세 모달 안에 넣을 때 — 별도 오버레이 없이 폼만 렌더 */
  embedded?: boolean;
  onOptimisticCreate?: (schedule: FlattenedSchedule) => void;
  /** embedded일 때 취소 버튼 (없으면 onClose) */
  onCancel?: () => void;
  /** 수정 저장 직후 상세 화면 즉시 반영 */
  onScheduleUpdated?: (schedule: FlattenedSchedule) => void;
};

export type CreateMode = 'single' | 'batch' | 'image' | 'text';
