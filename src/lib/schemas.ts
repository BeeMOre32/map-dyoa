import { z } from 'zod';

const participant = z.object({
  id: z.string(),
  nation: z.string().optional(),
  result: z.string().optional(),
});

export const scheduleServerSchema = z.object({
  title: z.string().min(1, '방송 제목을 입력해주세요.'),
  startTime: z.coerce.date().refine((d) => !isNaN(d.getTime()), '올바른 시간을 입력해주세요.'),
  participants: z.array(participant).min(1, '참여자를 최소 1명 이상 선택해주세요.'),
  gameId: z.string().optional(),
  liveUrl: z.string().optional(),
  isGuerrilla: z.boolean().optional(),
  isLiveEnded: z.boolean().optional(),
});

export const clipServerSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.'),
  url: z.string().min(1, '클립 URL을 입력해주세요.'),
  streamerIds: z.array(z.string()).min(1, '연관된 스트리머를 최소 1명 선택해주세요.'),
  thumbnailUrl: z.string().optional(),
  description: z.string().optional(),
  clipDate: z.coerce.date().nullable().optional(),
  scheduleId: z.string().optional(),
});

export const feedbackSchema = z.object({
  category: z.string().min(1, '카테고리를 선택해주세요.'),
  content: z.string().min(1, '내용을 입력해주세요.'),
});

export const streamerServerSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요.'),
  handle: z.string().min(1, '핸들을 입력해주세요.'),
  generation: z.number().int().positive().default(1),
  role: z.string().optional(),
  platform: z.string().default('CHZZK'),
  colorCode: z.string().default('#673AB7'),
  chzzkUrl: z.string().optional(),
  bio: z.string().optional(),
});

export const clipClientSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.'),
  url: z.string().min(1, '클립 URL을 입력해주세요.'),
  streamerIds: z.array(z.string()).min(1, '연관된 스트리머를 최소 1명 선택해주세요.'),
});
