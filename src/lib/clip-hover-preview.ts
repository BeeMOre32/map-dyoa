/** 동시에 하나의 클립 호버 미리보기만 유지 */

let activeClipId: string | null = null;
let onStolen: (() => void) | null = null;

export function claimClipHoverPreview(clipId: string, release: () => void): boolean {
  if (activeClipId && activeClipId !== clipId) {
    onStolen?.();
  }
  activeClipId = clipId;
  onStolen = release;
  return true;
}

export function releaseClipHoverPreview(clipId: string) {
  if (activeClipId === clipId) {
    activeClipId = null;
    onStolen = null;
  }
}
