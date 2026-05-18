/** 외부 링크 입력: 빈 값은 null, `https://` 없으면 붙임 */
export function normalizeExternalUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** 유튜브 등 저장용 — 파싱 가능한 URL이면 href 기준으로 정규화 */
export function normalizeYoutubeUrl(value: string): string | null {
  const raw = normalizeExternalUrl(value);
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.href;
  } catch {
    return null;
  }
}

function decodePathname(pathname: string): string {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

/** 인코딩(%EB%8D%B8…) vs 유니코드(@채널명) 등 동일 채널 URL 비교 */
export function externalUrlsEquivalent(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const left = a?.trim() || null;
  const right = b?.trim() || null;
  if (!left && !right) return true;
  if (!left || !right) return false;
  if (left === right) return true;

  try {
    const ua = new URL(left);
    const ub = new URL(right);
    const host = (h: string) => h.replace(/^www\./i, '').toLowerCase();
    if (host(ua.hostname) !== host(ub.hostname)) return false;
    if (ua.protocol !== ub.protocol) return false;

    if (ua.href === ub.href) return true;

    const pathA = decodePathname(ua.pathname);
    const pathB = decodePathname(ub.pathname);
    if (pathA === pathB) return true;

    return normalizeYoutubeUrl(left) === normalizeYoutubeUrl(right);
  } catch {
    return left === right;
  }
}
