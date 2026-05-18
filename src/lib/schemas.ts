import { z } from 'zod';

/** Server Action·AI 추출 등에서 null/빈 문자열로 오는 optional 문자열 → undefined */
function optionalString() {
  return z.preprocess(
    (val) =>
      val === null || val === undefined || (typeof val === 'string' && !val.trim())
        ? undefined
        : val,
    z.string().optional(),
  );
}

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
  title: z.preprocess(
    (val) => (typeof val === 'string' ? val : val == null ? '' : String(val)),
    z.string().min(1, '방송 제목을 입력해주세요.'),
  ),
  startTime: z.coerce
    .date()
    .refine((d) => !isNaN(d.getTime()), '올바른 시간을 입력해주세요.'),
  participants: z
    .array(participant)
    .min(1, '참여자를 최소 1명 이상 선택해주세요.'),
  gameId: optionalString(),
  liveUrls: z.array(z.string()).optional(),
  isGuerrilla: z.boolean().optional(),
  isNaeJeon: z.boolean().optional(),
  isLiveEnded: z.boolean().optional(),
});

export const clipServerSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.'),
  url: z.string().min(1, '클립 URL을 입력해주세요.'),
  streamerIds: z
    .array(z.string())
    .min(1, '연관된 스트리머를 최소 1명 선택해주세요.'),
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
  generation: z.preprocess((val) => {
    const n = typeof val === 'number' ? val : Number(val);
    if (!Number.isFinite(n) || n < 1) return 1;
    return Math.floor(n);
  }, z.number().int().positive()),
  role: z.string().optional(),
  platform: z.string().default('CHZZK'),
  profileImg: z.string().trim().url().optional().or(z.literal('')),
  colorCode: z.string().default('#673AB7'),
  chzzkUrl: z.preprocess(
    (val) => (typeof val === 'string' && !val.trim() ? undefined : val),
    z.string().optional(),
  ),
  youtubeUrl: z.preprocess(
    (val) => (typeof val === 'string' && !val.trim() ? undefined : val),
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
  bio: z.string().optional(),
  isGuest: z.boolean().optional(),
});

export const clipClientSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.'),
  url: z.string().min(1, '클립 URL을 입력해주세요.'),
  streamerIds: z
    .array(z.string())
    .min(1, '연관된 스트리머를 최소 1명 선택해주세요.'),
});
