import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getStreamerImagePath = (name: string): string => {
  if (!name) return '/images/default-avatar.webp';

  // 한글 파일명 깨짐 방지를 위해 encodeURIComponent 사용
  const safeName = encodeURIComponent(name.trim());
  return `/images/streamers/${safeName}.webp`;
};
