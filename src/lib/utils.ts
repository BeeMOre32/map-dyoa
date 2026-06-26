import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CHOSUNG = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
];

export function getChosung(str: string): string {
  return str
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0) - 0xac00;
      if (code < 0 || code > 11171) return char;
      return CHOSUNG[Math.floor(code / 28 / 21)];
    })
    .join('');
}

export const getStreamerImagePath = (name: string): string => {
  if (!name) return '/images/default-avatar.svg';

  const trimmed = name.trim();
  // UTF-8 파일명 유지, 공백·특수문자만 인코딩 (encodeURIComponent는 한글 경로 불일치 유발)
  return encodeURI(`/images/streamers/${trimmed}.webp`);
};

/** DB profileImg → 없으면 public/streamers 로컬 webp */
export function resolveStreamerAvatarSrc(streamer: {
  name: string;
  profileImg?: string | null;
}): string {
  const remote = streamer.profileImg?.trim();
  if (remote) return remote;
  return getStreamerImagePath(streamer.name);
}

export {
  normalizeExternalUrl,
  normalizeYoutubeUrl,
  externalUrlsEquivalent,
} from '@/lib/external-url';
