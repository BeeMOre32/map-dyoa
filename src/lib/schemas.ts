import { z } from 'zod';
import {
  nullishStringToUndefined,
  optionalString,
  optionalStringArray,
  optionalUrlOrEmptyString,
  requiredString,
  stringIdArray,
} from '@/lib/zod-helpers';

const participant = z.object({
  id: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim() : val == null ? '' : String(val)),
    z.string().min(1, '참여자 ID가 올바르지 않습니다.'),
  ),
  nation: optionalString(),
  result: optionalString(),
  isGuest: z.boolean().optional(),
});

export const scheduleServerSchema = z.object({
  title: requiredString('방송 제목을 입력해주세요.'),
  startTime: z.coerce
    .date()
    .refine((d) => !isNaN(d.getTime()), '올바른 시간을 입력해주세요.'),
  participants: z
    .array(participant)
    .min(1, '참여자를 최소 1명 이상 선택해주세요.'),
  gameId: optionalString(),
  liveUrls: optionalStringArray(),
  isGuerrilla: z.boolean().optional(),
  isNaeJeon: z.boolean().optional(),
  isLiveEnded: z.boolean().optional(),
});

export const clipServerSchema = z.object({
  title: requiredString('제목을 입력해주세요.'),
  url: requiredString('클립 URL을 입력해주세요.'),
  streamerIds: stringIdArray('연관된 스트리머를 최소 1명 선택해주세요.'),
  thumbnailUrl: optionalString(),
  description: optionalString(),
  clipDate: z.preprocess(
    (val) => (val === null || val === '' ? undefined : val),
    z.coerce.date().optional(),
  ),
  scheduleId: optionalString(),
});

export const feedbackSchema = z.object({
  category: requiredString('카테고리를 선택해주세요.'),
  content: requiredString('내용을 입력해주세요.'),
});

export const streamerServerSchema = z.object({
  name: requiredString('이름을 입력해주세요.'),
  handle: requiredString('핸들을 입력해주세요.'),
  generation: z.preprocess((val) => {
    const n = typeof val === 'number' ? val : Number(val);
    if (!Number.isFinite(n) || n < 1) return 1;
    return Math.floor(n);
  }, z.number().int().positive()),
  role: optionalString(),
  platform: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() ? val.trim() : 'CHZZK'),
    z.string(),
  ),
  profileImg: optionalUrlOrEmptyString(),
  colorCode: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() ? val.trim() : '#673AB7'),
    z.string(),
  ),
  chzzkUrl: z.preprocess(nullishStringToUndefined, z.string().optional()),
  youtubeUrl: z.preprocess(
    nullishStringToUndefined,
    z
      .string()
      .refine(
        (s) => {
          try {
            const u = new URL(s);
            return u.protocol === 'http:' || u.protocol === 'https:';
          } catch {
            return false;
          }
        },
        { message: '유튜브 주소는 https:// 로 시작하는 올바른 URL이어야 합니다.' },
      )
      .optional(),
  ),
  bio: optionalString(),
  isGuest: z.boolean().optional(),
});

export const clipClientSchema = z.object({
  title: requiredString('제목을 입력해주세요.'),
  url: requiredString('클립 URL을 입력해주세요.'),
  streamerIds: stringIdArray('연관된 스트리머를 최소 1명 선택해주세요.'),
});
