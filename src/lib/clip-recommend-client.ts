const VOTER_KEY = 'clip-voter-id';
const SET_KEY = 'clip-recommended';
const EVENT = 'clip-recommend-change';
const VOTER_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ClipRecommendChange = {
  clipId: string;
  recommends: number;
  recommended: boolean;
};

function readSet(): string[] {
  try {
    const raw = localStorage.getItem(SET_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function readClipRecommended(clipId: string): boolean {
  if (typeof window === 'undefined' || !clipId) return false;
  return readSet().includes(clipId);
}

function writeClipRecommended(clipId: string, recommended: boolean) {
  const next = readSet().filter((id) => id !== clipId);
  if (recommended) next.push(clipId);
  localStorage.setItem(SET_KEY, JSON.stringify(next));
}

export function clipVoterId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(VOTER_KEY);
    if (stored && VOTER_ID.test(stored)) return stored.toLowerCase();
    const created = crypto.randomUUID();
    localStorage.setItem(VOTER_KEY, created);
    return created;
  } catch {
    return null;
  }
}

export function publishClipRecommend(detail: ClipRecommendChange) {
  try {
    writeClipRecommended(detail.clipId, detail.recommended);
  } catch {
    /* 저장을 못해도 이번 화면의 표시는 갱신한다 */
  }
  window.dispatchEvent(new CustomEvent<ClipRecommendChange>(EVENT, { detail }));
}

export function subscribeClipRecommend(
  clipId: string,
  onChange: (detail: ClipRecommendChange) => void,
) {
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<ClipRecommendChange>).detail;
    if (detail?.clipId === clipId) onChange(detail);
  };
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

export async function toggleClipRecommend(
  clipId: string,
): Promise<ClipRecommendChange | null> {
  const voterId = clipVoterId();
  if (!voterId) return null;
  const res = await fetch('/api/clips/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clipId, voterId }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { recommends?: unknown; recommended?: unknown };
  if (typeof data.recommends !== 'number' || typeof data.recommended !== 'boolean') return null;
  const detail = { clipId, recommends: data.recommends, recommended: data.recommended };
  publishClipRecommend(detail);
  return detail;
}
