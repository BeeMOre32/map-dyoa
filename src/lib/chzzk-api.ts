export const CHZZK_API_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Origin: 'https://chzzk.naver.com',
  'front-client-platform-type': 'PC',
  'front-client-product-type': 'web',
};

/** polling live-status 응답. live-detail에도 같은 필드가 있다. */
export type ChzzkLiveStatusContent = {
  status?: string;
  liveTitle?: string;
  liveCategory?: string;
  liveCategoryValue?: string;
  concurrentUserCount?: number;
  accumulateCount?: number;
  openDate?: string;
  adult?: boolean;
  tags?: string[];
};

export type ChzzkLiveDetailContent = ChzzkLiveStatusContent & {
  /** `{type}` 자리에 해상도(144·270·360·480·720·1080)를 넣어 쓰는 템플릿 */
  liveImageUrl?: string | null;
  defaultThumbnailImageUrl?: string | null;
  channel?: { channelName?: string };
};

const LIVE_DETAIL_URL = (channelId: string) =>
  `https://api.chzzk.naver.com/service/v2/channels/${channelId}/live-detail`;

/** live-detail 대비 응답이 1/5 수준. polling v1은 500을 반환한다. */
const LIVE_STATUS_URL = (channelId: string) =>
  `https://api.chzzk.naver.com/polling/v2/channels/${channelId}/live-status`;

export function isChzzkChannelLive(content: ChzzkLiveStatusContent | null | undefined): boolean {
  return content?.status === 'OPEN';
}

export type ChzzkLiveThumbnailSize = 270 | 360 | 480 | 720 | 1080;

export function chzzkLiveThumbnailUrl(
  content: ChzzkLiveDetailContent | null | undefined,
  size: ChzzkLiveThumbnailSize = 480,
): string | null {
  const template = content?.liveImageUrl?.trim();
  if (template) return template.replace('{type}', String(size));
  return content?.defaultThumbnailImageUrl?.trim() || null;
}

type ChzzkContentResult<T> = { ok: true; content: T | null } | { ok: false };

/** HTTP 오류·타임아웃은 ok:false, 정상 응답의 content null은 ok:true로 구분 */
async function fetchChzzkContent<T>(
  url: string,
  opts: { timeoutMs: number; retries: number },
): Promise<ChzzkContentResult<T>> {
  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
      const res = await fetch(url, {
        headers: CHZZK_API_HEADERS,
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) continue;

      const json = (await res.json()) as { content?: T | null };
      return { ok: true, content: json.content ?? null };
    } catch {
      // 다음 시도
    }
  }
  return { ok: false };
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
  const result = await fetchChzzkContent<ChzzkLiveDetailContent>(LIVE_DETAIL_URL(channelId), {
    timeoutMs: opts?.timeoutMs ?? 6000,
    retries: opts?.retries ?? 1,
  });
  return result.ok ? result.content : null;
}

/**
 * 방송 상태·제목·카테고리·시청자·openDate. 썸네일·재생 정보는 없다.
 * polling이 실패할 때만 live-detail로 한 번 더 조회한다.
 */
export async function fetchChzzkLiveStatus(
  channelId: string,
  opts?: { timeoutMs?: number },
): Promise<ChzzkLiveStatusContent | null> {
  const result = await fetchChzzkContent<ChzzkLiveStatusContent>(LIVE_STATUS_URL(channelId), {
    timeoutMs: opts?.timeoutMs ?? 4000,
    retries: 0,
  });
  if (result.ok) return result.content;
  return fetchChzzkLiveDetail(channelId);
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
