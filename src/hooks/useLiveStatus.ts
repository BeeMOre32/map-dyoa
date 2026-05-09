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
  try {
    const res = await fetch('/api/chzzk/live-status');
    if (!res.ok) return;
    const data: { liveStreamerIds: string[] } = await res.json();
    cache = new Set(data.liveStreamerIds);
    lastFetchedAt = Date.now();
    notifyState();
  } catch {
    // 네트워크 실패 시 기존 캐시 유지
  } finally {
    isFetching = false;
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

type LiveStatusState = { liveIds: Set<string>; isLoading: boolean };

const stateListeners = new Set<(s: LiveStatusState) => void>();

function notifyState() {
  const state = { liveIds: new Set(cache), isLoading: false };
  stateListeners.forEach((fn) => fn(state));
}

export function useLiveStatus(): LiveStatusState {
  // 첫 서버 렌더·클라이언트 hydration 첫 프레임은 동일해야 함(SSR/CSR 번들 간에도 라이브 상태로 트리가 갈라지면 hydration 오류 발생).
  const [state, setState] = useState<LiveStatusState>({
    liveIds: new Set(),
    isLoading: true,
  });

  useEffect(() => {
    stateListeners.add(setState);

    if (stateListeners.size === 1) {
      if (lastFetchedAt === 0) {
        fetchLiveStatus();
      } else {
        setState({ liveIds: new Set(cache), isLoading: false });
      }
      startPolling();
      document.addEventListener('visibilitychange', onVisibilityChange);
    } else if (lastFetchedAt > 0) {
      setState({ liveIds: new Set(cache), isLoading: false });
    }

    return () => {
      stateListeners.delete(setState);
      if (stateListeners.size === 0) {
        stopPolling();
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    };
  }, []);

  return state;
}
