'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

let nowMs = Date.now();
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function tick() {
  nowMs = Date.now();
  listeners.forEach((fn) => fn());
}

function ensureTimer() {
  if (timer !== null) return;
  const msUntilNextMinute = 60_000 - (Date.now() % 60_000);
  setTimeout(() => {
    tick();
    timer = setInterval(tick, 60_000);
  }, msUntilNextMinute);
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  ensureTimer();
  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot() {
  return nowMs;
}

/** 분 단위로 갱신 — 일정 시작 시각 경과 후 LIVE UI 반영 */
export function useMinuteClock(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
