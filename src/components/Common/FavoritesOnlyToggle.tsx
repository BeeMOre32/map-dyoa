'use client';

import { Star } from 'lucide-react';
import { useFavoriteStreamers } from '@/hooks/useFavoriteStreamers';

type Props = {
  className?: string;
  /** 즐겨찾기 멤버가 없을 때 버튼 숨김 */
  hideWhenEmpty?: boolean;
};

export default function FavoritesOnlyToggle({
  className = '',
  hideWhenEmpty = true,
}: Props) {
  const { favorites, favoritesOnly, setFavoritesOnly } = useFavoriteStreamers();

  if (hideWhenEmpty && favorites.length === 0) return null;

  return (
    <button
      type="button"
      onClick={() => setFavoritesOnly(!favoritesOnly)}
      disabled={favorites.length === 0}
      title={
        favorites.length === 0
          ? '필터에서 별을 눌러 관심 멤버를 등록하세요'
          : favoritesOnly
            ? '전체 멤버 보기'
            : '관심 멤버만 보기'
      }
      className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-bold shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        favoritesOnly
          ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
          : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
      } ${className}`}
    >
      <Star
        className={`h-3.5 w-3.5 ${favoritesOnly ? 'fill-amber-400 text-amber-400' : ''}`}
      />
      {favoritesOnly ? '관심 멤버' : '전체'}
    </button>
  );
}
