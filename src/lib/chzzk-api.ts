export const CHZZK_API_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Origin: 'https://chzzk.naver.com',
  'front-client-platform-type': 'PC',
  'front-client-product-type': 'web',
};

export type ChzzkLiveDetailContent = {
  status?: string;
  liveTitle?: string;
  liveCategory?: string;
  concurrentUserCount?: number;
  openDate?: string;
  channel?: { channelName?: string };
};

const LIVE_DETAIL_URL = (channelId: string) =>
  `https://api.chzzk.naver.com/service/v2/channels/${channelId}/live-detail`;

export function isChzzkChannelLive(content: ChzzkLiveDetailContent | null | undefined): boolean {
  return content?.status === 'OPEN';
}

/**
 * 치지직 openDate → Date.
 * 타임존 없는 `"YYYY-MM-DD HH:mm:ss"` 는 KST로 본다.
 */
export function parseChzzkOpenDate(raw: string | null | undefined): Date | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();
  if (/[zZ]$/.test(s) || /[+-]\d{2}:\d{2}$/.test(s)) {
    const d = new Date(s);
    return Number.isFinite(d.getTime()) ? d : null;
  }
  const m = s.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/,
  );
  if (!m) return null;
  const d = new Date(
    `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] ?? '00'}+09:00`,
  );
  return Number.isFinite(d.getTime()) ? d : null;
}

/** 치지직 live-detail — content null·HTTP 오류는 null 반환 */
export async function fetchChzzkLiveDetail(
  channelId: string,
  opts?: { timeoutMs?: number; retries?: number },
): Promise<ChzzkLiveDetailContent | null> {
  const timeoutMs = opts?.timeoutMs ?? 6000;
  const retries = opts?.retries ?? 1;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(LIVE_DETAIL_URL(channelId), {
        headers: CHZZK_API_HEADERS,
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        if (attempt < retries) continue;
        return null;
      }

      const json = (await res.json()) as {
        code?: number;
        content?: ChzzkLiveDetailContent | null;
      };

      if (json.content == null) return null;
      return json.content;
    } catch {
      if (attempt < retries) continue;
      return null;
    }
  }

  return null;
}

export type ChzzkClipListItem = {
  clipUID: string;
  clipTitle?: string;
  thumbnailImageUrl?: string | null;
  readCount?: number;
  createdDate?: string;
  adult?: boolean;
  blindType?: string | null;
};

export type ChzzkClipListPage = {
  items: ChzzkClipListItem[];
  nextClipUID: string | null;
};

/**
 * 채널 클립 목록.
 * 최근 반응은 `orderType=RECENT` 로 받은 뒤 날짜·조회수로 거른다.
 * `orderType=POPULAR` 는 전체 기간 인기라 최근 클립이 빠지기 쉽다.
 */
export async function fetchChzzkChannelClips(
  channelId: string,
  opts?: {
    size?: number;
    orderType?: 'RECENT' | 'POPULAR';
    clipUID?: string | null;
    timeoutMs?: number;
    retries?: number;
  },
): Promise<ChzzkClipListPage | null> {
  const size = opts?.size ?? 20;
  const orderType = opts?.orderType ?? 'RECENT';
  const timeoutMs = opts?.timeoutMs ?? 8000;
  const retries = opts?.retries ?? 1;
  const qs = new URLSearchParams({
    size: String(size),
    orderType,
  });
  if (opts?.clipUID) qs.set('clipUID', opts.clipUID);
  const url = `https://api.chzzk.naver.com/service/v1/channels/${channelId}/clips?${qs.toString()}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, {
        headers: CHZZK_API_HEADERS,
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        if (attempt < retries) continue;
        return null;
      }

      const json = (await res.json()) as {
        content?: {
          data?: ChzzkClipListItem[];
          page?: { next?: { clipUID?: string } | null };
        } | null;
      };
      const data = json.content?.data ?? [];
      const next = json.content?.page?.next?.clipUID?.trim() || null;
      return {
        items: data.filter((item) => item.clipUID?.trim()),
        nextClipUID: next,
      };
    } catch {
      if (attempt < retries) continue;
      return null;
    }
  }

  return null;
}

/** 동시 요청 수 제한 — 치지직 rate limit·타임아웃 완화 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];

  const results = new Array<R>(items.length);
  let next = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) break;
      results[i] = await fn(items[i], i);
    }
  });

  await Promise.all(workers);
  return results;
}
