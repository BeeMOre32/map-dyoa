/** 멀티뷰 세션 상태 localStorage 키·읽기/쓰기 */

import type { LayoutPreset } from './utils';

export type MultiviewPersistedState = {
  order: string[];
  visible: string[];
  loaded: string[];
  focusedId: string | null;
  chatStreamerId: string | null;
  pinControls: boolean;
  mutedIds: string[];
  layoutPreset: LayoutPreset;
  gridRowH?: number[];
  gridColB?: number[][];
  focusSplit?: number;
  focusSideH?: number[];
};

const PREFIX = 'map-dyoa-mv:';

export function multiviewStorageKey(participantIds: string[]): string {
  return PREFIX + [...participantIds].sort().join(',');
}

export function loadMultiviewState(key: string): MultiviewPersistedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as MultiviewPersistedState;
  } catch {
    return null;
  }
}

export function saveMultiviewState(key: string, state: MultiviewPersistedState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // quota 등 무시
  }
}
