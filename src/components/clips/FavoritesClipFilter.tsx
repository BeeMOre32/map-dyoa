'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useFavoriteStreamers } from '@/hooks/useFavoriteStreamers';

/** 클립 페이지: 관심 멤버 모드 ↔ URL 쿼리 동기화 */
export default function FavoritesClipFilter({
  favoritesParam,
}: {
  favoritesParam: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { favorites, favoritesOnly, setFavoritesOnly } = useFavoriteStreamers();
  const favoritesKey = favorites.join(',');
  const lastNavRef = useRef<string | null>(null);
  /** URL→로컬 1회만 (끈 뒤 URL이 남아 있어도 다시 켜지지 않게) */
  const syncedFromUrlRef = useRef(false);

  useEffect(() => {
    if (pathname !== '/clips' || syncedFromUrlRef.current) return;
    if (!favoritesParam || favoritesOnly) return;
    syncedFromUrlRef.current = true;
    setFavoritesOnly(true);
  }, [pathname, favoritesParam, favoritesOnly, setFavoritesOnly]);

  useEffect(() => {
    if (pathname !== '/clips') return;

    if (!favoritesOnly) {
      if (!favoritesParam) return;
      const params = new URLSearchParams(window.location.search);
      if (!params.has('favorites') && !params.has('streamers')) return;
      const target = (() => {
        params.delete('favorites');
        params.delete('streamers');
        const qs = params.toString();
        return qs ? `/clips?${qs}` : '/clips';
      })();
      if (lastNavRef.current === target) return;
      lastNavRef.current = target;
      router.replace(target);
      return;
    }

    if (favorites.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const streamers = favoritesKey;
    if (params.get('favorites') === '1' && (params.get('streamers') ?? '') === streamers) {
      return;
    }

    params.set('favorites', '1');
    params.set('streamers', streamers);
    params.delete('streamer');
    params.delete('page');
    const target = `/clips?${params.toString()}`;
    if (lastNavRef.current === target) return;
    lastNavRef.current = target;
    router.replace(target);
  }, [pathname, favoritesOnly, favoritesParam, favoritesKey, favorites.length, router]);

  return null;
}
