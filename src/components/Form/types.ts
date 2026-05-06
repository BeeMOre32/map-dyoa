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
  liveUrls: string[];
  isTimeTBD: boolean;
  metaLoading: boolean;
  autoFilled: string[];
  errors: SlotErrors;
};

export type EditErrors = Partial<
  Record<keyof z.infer<typeof editSchema> | 'submit', string>
>;

export type ParticipantEntry = { id: string; nation: string; result: string };

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
  onOptimisticCreate?: (schedule: FlattenedSchedule) => void;
};

export type CreateMode = 'single' | 'batch' | 'image' | 'text';
