import type { Streamer } from '@prisma/client';
import { extractChzzkChannelId } from '@/lib/chzzk';

export const MAX_STREAMS = 9;
export const HANDLE_CLS = 'absolute z-20 bg-slate-900 hover:bg-indigo-500/60 transition-colors';

const MV_EMBED_FLAG = 'map-dyoa-mv=1';

function withMultiviewEmbedParam(url: string): string {
  if (url.includes(MV_EMBED_FLAG)) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}${MV_EMBED_FLAG}`;
}

export type LayoutPreset = 'auto' | 'single-row' | 'balanced';

/** 멀티뷰 iframe → 치지직 확장 스크립트용 postMessage */
export function postToChzzkIframe(
  iframe: HTMLIFrameElement | null,
  type: 'toggle-chat' | 'toggle-mute' | 'fullscreen',
  payload: Record<string, unknown> = {},
) {
  iframe?.contentWindow?.postMessage(
    { source: 'map-dyoa-multiview', type, ...payload },
    '*',
  );
}

export function getChannelUrl(streamer: Streamer): string {
  const base = streamer.chzzkUrl ?? `https://chzzk.naver.com/${streamer.handle}`;
  const channelId = streamer.chzzkUrl ? extractChzzkChannelId(streamer.chzzkUrl) : null;
  if (channelId) return `https://chzzk.naver.com/${channelId}`;
  return base;
}

export function getLiveUrl(streamer: Streamer): string {
  const channelId = streamer.chzzkUrl ? extractChzzkChannelId(streamer.chzzkUrl) : null;
  if (channelId) return withMultiviewEmbedParam(`https://chzzk.naver.com/live/${channelId}`);
  const base = streamer.chzzkUrl ?? `https://chzzk.naver.com/${streamer.handle}`;
  return withMultiviewEmbedParam(base);
}

export function getChatUrl(streamer: Streamer): string {
  const channelId = streamer.chzzkUrl ? extractChzzkChannelId(streamer.chzzkUrl) : null;
  if (channelId) {
    return withMultiviewEmbedParam(`https://chzzk.naver.com/live/${channelId}/chat`);
  }
  const handle = streamer.handle?.trim();
  if (handle) {
    return withMultiviewEmbedParam(`https://chzzk.naver.com/live/${handle}/chat`);
  }
  return withMultiviewEmbedParam('https://chzzk.naver.com/chat');
}

export function getPanelRows<T>(panels: T[], preset: LayoutPreset = 'auto'): T[][] {
  const n = panels.length;
  if (n === 0) return [];
  if (preset === 'single-row') return [panels];
  if (preset === 'balanced') {
    const cols = Math.min(3, Math.ceil(Math.sqrt(n)));
    const rows: T[][] = [];
    for (let i = 0; i < n; i += cols) rows.push(panels.slice(i, i + cols));
    return rows;
  }
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
