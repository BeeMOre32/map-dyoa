/** LIVE 미리보기 iframe — 동시에 하나의 스트림만 (호버·상세 공유) */

export type LiveEmbedOwner = 'hover' | 'detail';

type CloseFn = () => void;

type Active = {
  id: string;
  owner: LiveEmbedOwner;
  close: CloseFn;
};

let active: Active | null = null;

/**
 * 전역 1스트림. 다른 소유자/스트림이면 기존 재생을 닫고 클레임.
 * 상세가 같은 스트림을 잡고 있을 때 호버 클레임은 거부(false).
 */
export function claimLiveEmbed(
  streamerId: string,
  owner: LiveEmbedOwner,
  close: CloseFn,
): boolean {
  if (
    owner === 'hover' &&
    active?.owner === 'detail' &&
    active.id === streamerId
  ) {
    return false;
  }
  if (
    active &&
    (active.id !== streamerId || active.owner !== owner)
  ) {
    active.close();
  }
  active = { id: streamerId, owner, close };
  return true;
}

export function releaseLiveEmbed(streamerId: string, owner: LiveEmbedOwner) {
  if (active?.id === streamerId && active.owner === owner) {
    active = null;
  }
}

/** 해당 스트림이 이미 다른(또는 지정) 소유자로 재생 중인지 */
export function isLiveEmbedHeld(
  streamerId: string,
  byOwner?: LiveEmbedOwner,
): boolean {
  if (!active || active.id !== streamerId) return false;
  if (byOwner) return active.owner === byOwner;
  return true;
}

/** @deprecated claimLiveEmbed('hover') 사용 */
export function claimLivePreview(streamerId: string, close: CloseFn) {
  claimLiveEmbed(streamerId, 'hover', close);
}

/** @deprecated releaseLiveEmbed(id, 'hover') 사용 */
export function releaseLivePreview(streamerId: string) {
  releaseLiveEmbed(streamerId, 'hover');
}
