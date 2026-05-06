import type { Streamer } from '@prisma/client';

export const MAX_STREAMS = 9;
export const HANDLE_CLS = 'absolute z-20 bg-slate-900 hover:bg-indigo-500/60 transition-colors';

export function getChannelUrl(streamer: Streamer): string {
  const base = streamer.chzzkUrl ?? `https://chzzk.naver.com/${streamer.handle}`;
  try {
    const { pathname } = new URL(base);
    const segments = pathname.split('/').filter(Boolean);
    const channelId = segments[segments.length - 1];
    if (channelId && channelId !== 'live') return `https://chzzk.naver.com/${channelId}`;
  } catch {}
  return base;
}

export function getLiveUrl(streamer: Streamer): string {
  const base = streamer.chzzkUrl ?? `https://chzzk.naver.com/${streamer.handle}`;
  try {
    const { pathname } = new URL(base);
    const segments = pathname.split('/').filter(Boolean);
    const channelId = segments[segments.length - 1];
    if (channelId && channelId !== 'live') {
      return `https://chzzk.naver.com/live/${channelId}`;
    }
  } catch {}
  return base;
}

export function getChatUrl(streamer: Streamer): string {
  return `${getLiveUrl(streamer)}/chat`;
}

export function getPanelRows<T>(panels: T[]): T[][] {
  const n = panels.length;
  if (n <= 2) return [panels];
  if (n === 9) return [panels.slice(0, 3), panels.slice(3, 6), panels.slice(6)];
  const half = Math.ceil(n / 2);
  return [panels.slice(0, half), panels.slice(half)];
}

export function cumulativeTops(heights: number[]): number[] {
  const tops: number[] = [];
  let cum = 0;
  for (const h of heights) { tops.push(cum); cum += h; }
  return tops;
}

export function startDrag(
  e: { preventDefault(): void; clientX: number; clientY: number },
  axis: 'x' | 'y',
  containerRef: { current: HTMLDivElement | null },
  onDelta: (pct: number) => void,
) {
  e.preventDefault();
  document.body.classList.add('is-resizing');
  let prev = axis === 'x' ? e.clientX : e.clientY;
  const onMove = (ev: MouseEvent) => {
    const cur = axis === 'x' ? ev.clientX : ev.clientY;
    const size = axis === 'x'
      ? (containerRef.current?.offsetWidth ?? 1)
      : (containerRef.current?.offsetHeight ?? 1);
    onDelta((cur - prev) / size * 100);
    prev = cur;
  };
  const onUp = () => {
    document.body.classList.remove('is-resizing');
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

export function startPixelDrag(
  e: { preventDefault(): void; clientX: number },
  onDelta: (px: number) => void,
) {
  e.preventDefault();
  document.body.classList.add('is-resizing');
  let prev = e.clientX;
  const onMove = (ev: MouseEvent) => {
    onDelta(ev.clientX - prev);
    prev = ev.clientX;
  };
  const onUp = () => {
    document.body.classList.remove('is-resizing');
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}
