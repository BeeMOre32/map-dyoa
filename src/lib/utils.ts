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

  // 한글 파일명 깨짐 방지를 위해 encodeURIComponent 사용
  const safeName = encodeURIComponent(name.trim());
  return `/images/streamers/${safeName}.webp`;
};
