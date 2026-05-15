'use client';

import { useEffect, useState } from 'react';

const POLL_INTERVAL = 60_000;

let cache = new Set<string>();
let lastFetchedAt = 0;
let isFetching = false;
let timer: ReturnType<typeof setInterval> | null = null;

async function fetchLiveStatus() {
  if (isFetching) return;
  isFetching = true;
  notifyState({ isRefreshing: lastFetchedAt > 0 });
  try {
    const res = await fetch(`/api/chzzk/live-status?ts=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return;
    const data: { liveStreamerIds: string[] } = await res.json();
    cache = new Set(data.liveStreamerIds);
    lastFetchedAt = Date.now();
  } catch {
    // 네트워크 실패 시 기존 캐시 유지
  } finally {
    isFetching = false;
    notifyState();
  }
}

function startPolling() {
  if (timer !== null) return;
  timer = setInterval(() => {
    if (document.visibilityState === 'visible') fetchLiveStatus();
  }, POLL_INTERVAL);
}

function stopPolling() {
  if (timer === null) return;
  clearInterval(timer);
  timer = null;
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    // 숨겨진 동안 60초 이상 지났으면 즉시 갱신
    if (Date.now() - lastFetchedAt >= POLL_INTERVAL) fetchLiveStatus();
    startPolling();
  } else {
    stopPolling();
  }
}

type LiveStatusState = {
  liveIds: Set<string>;
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdatedAt: number | null;
};

const stateListeners = new Set<(s: LiveStatusState) => void>();

function notifyState(overrides: Partial<LiveStatusState> = {}) {
  const state = {
    liveIds: new Set(cache),
    isLoading: lastFetchedAt === 0,
    isRefreshing: false,
    lastUpdatedAt: lastFetchedAt || null,
    ...overrides,
  };
  stateListeners.forEach((fn) => fn(state));
}

function seedFromServer(ids: string[], fetchedAt: number) {
  cache = new Set(ids);
  lastFetchedAt = fetchedAt;
}

export function useLiveStatus(
  initialLiveIds?: string[],
  initialLiveFetchedAt?: number,
): LiveStatusState {
  const [state, setState] = useState<LiveStatusState>(() => {
    if (initialLiveIds !== undefined) {
      const fetchedAt = initialLiveFetchedAt ?? 0;
      return {
        liveIds: new Set(initialLiveIds),
        isLoading: false,
        isRefreshing: false,
        lastUpdatedAt: fetchedAt > 0 ? fetchedAt : null,
      };
    }
    if (lastFetchedAt > 0) {
      return {
        liveIds: new Set(cache),
        isLoading: false,
        isRefreshing: false,
        lastUpdatedAt: lastFetchedAt,
      };
    }
    return {
      liveIds: new Set(),
      isLoading: true,
      isRefreshing: false,
      lastUpdatedAt: null,
    };
  });

  useEffect(() => {
    stateListeners.add(setState);

    if (stateListeners.size === 1) {
      const hasServerSeed = initialLiveIds !== undefined;
      if (hasServerSeed) {
        seedFromServer(initialLiveIds, initialLiveFetchedAt ?? Date.now());
      }
      if (lastFetchedAt === 0) {
        fetchLiveStatus();
      }
      startPolling();
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    return () => {
      stateListeners.delete(setState);
      if (stateListeners.size === 0) {
        stopPolling();
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    };
    // initialLiveIds는 RSC에서 1회만 전달
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
