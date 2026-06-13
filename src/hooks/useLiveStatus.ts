'use client';

import { useCallback, useEffect, useState } from 'react';

/** 백그라운드 폴링 간격 */
export const LIVE_STATUS_POLL_MS = 45_000;
/** 탭 복귀·수동 갱신 시 이 시간보다 오래됐으면 즉시 재조회 */
export const LIVE_STATUS_STALE_MS = 30_000;

let cache = new Set<string>();
let lastFetchedAt = 0;
let isFetching = false;
let timer: ReturnType<typeof setInterval> | null = null;
let staleTimer: ReturnType<typeof setInterval> | null = null;

type LiveStatusApiResponse = {
  liveStreamerIds: string[];
  fetchedAt?: number;
};

async function fetchLiveStatus(force = false) {
  if (isFetching && !force) return;
  isFetching = true;
  notifyState({ isRefreshing: lastFetchedAt > 0 });
  try {
    const res = await fetch(`/api/chzzk/live-status?ts=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return;
    const data: LiveStatusApiResponse = await res.json();
    cache = new Set(data.liveStreamerIds);
    lastFetchedAt = data.fetchedAt ?? Date.now();
  } catch {
    // 네트워크 실패 시 기존 캐시 유지
  } finally {
    isFetching = false;
    notifyState();
  }
}

/** 수동 새로고침 — UI 버튼·외부 호출용 */
export function refreshLiveStatus() {
  return fetchLiveStatus(true);
}

function startStaleCheck() {
  if (staleTimer !== null) return;
  staleTimer = setInterval(() => {
    if (stateListeners.size > 0 && lastFetchedAt > 0) notifyState();
  }, 10_000);
}

function stopStaleCheck() {
  if (staleTimer === null) return;
  clearInterval(staleTimer);
  staleTimer = null;
}

function startPolling() {
  if (timer !== null) return;
  timer = setInterval(() => {
    if (document.visibilityState === 'visible') fetchLiveStatus();
  }, LIVE_STATUS_POLL_MS);
}

function stopPolling() {
  if (timer === null) return;
  clearInterval(timer);
  timer = null;
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    if (Date.now() - lastFetchedAt >= LIVE_STATUS_STALE_MS) fetchLiveStatus();
    startPolling();
  } else {
    stopPolling();
  }
}

export type LiveStatusState = {
  liveIds: Set<string>;
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdatedAt: number | null;
  /** 마지막 갱신 후 STALE_MS 초과 */
  isStale: boolean;
  refresh: () => void;
};

const stateListeners = new Set<(s: LiveStatusState) => void>();

function buildState(overrides: Partial<LiveStatusState> = {}): LiveStatusState {
  const lastUpdatedAt = lastFetchedAt || null;
  return {
    liveIds: new Set(cache),
    isLoading: lastFetchedAt === 0,
    isRefreshing: false,
    lastUpdatedAt,
    isStale:
      lastUpdatedAt !== null && Date.now() - lastUpdatedAt >= LIVE_STATUS_STALE_MS,
    refresh: refreshLiveStatus,
    ...overrides,
  };
}

function notifyState(overrides: Partial<LiveStatusState> = {}) {
  const state = buildState(overrides);
  stateListeners.forEach((fn) => fn(state));
}

function seedFromServer(ids: string[]) {
  cache = new Set(ids);
  lastFetchedAt = 0;
}

export function useLiveStatus(initialLiveIds?: string[]): LiveStatusState {
  const [state, setState] = useState<LiveStatusState>(() => {
    if (initialLiveIds !== undefined) {
      return {
        liveIds: new Set(initialLiveIds),
        isLoading: false,
        isRefreshing: true,
        lastUpdatedAt: null,
        isStale: true,
        refresh: refreshLiveStatus,
      };
    }
    if (lastFetchedAt > 0) {
      return buildState();
    }
    return {
      liveIds: new Set(),
      isLoading: true,
      isRefreshing: false,
      lastUpdatedAt: null,
      isStale: false,
      refresh: refreshLiveStatus,
    };
  });

  const refresh = useCallback(() => {
    refreshLiveStatus();
  }, []);

  useEffect(() => {
    stateListeners.add(setState);

    if (stateListeners.size === 1) {
      if (initialLiveIds !== undefined) {
        seedFromServer(initialLiveIds);
      }
      fetchLiveStatus();
      startPolling();
      startStaleCheck();
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    return () => {
      stateListeners.delete(setState);
      if (stateListeners.size === 0) {
        stopPolling();
        stopStaleCheck();
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    };
    // initialLiveIds는 RSC에서 1회만 전달
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...state, refresh };
}
