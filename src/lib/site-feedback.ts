export const SITE_FEEDBACK_CATEGORIES = ['의견', '오류', '일정', '기타'] as const;

export type SiteFeedbackCategory = (typeof SITE_FEEDBACK_CATEGORIES)[number];

const WINDOW_MS = 10 * 60 * 1000;
const PER_IP = 3;
const GLOBAL_MAX = 30;
const buckets = new Map<string, number[]>();

function prune(now: number, stamps: number[]) {
  return stamps.filter((stamp) => now - stamp < WINDOW_MS);
}

/** 같은 주소에서 짧은 시간에 많이 쌓이지 않게 막는다. 인스턴스 메모리라 완전하지는 않다. */
export function takeSiteFeedbackSlot(key: string): boolean {
  const now = Date.now();
  const own = prune(now, buckets.get(key) ?? []);
  const global = prune(now, buckets.get('*') ?? []);
  if (own.length >= PER_IP || global.length >= GLOBAL_MAX) {
    buckets.set(key, own);
    buckets.set('*', global);
    return false;
  }
  own.push(now);
  global.push(now);
  buckets.set(key, own);
  buckets.set('*', global);
  if (buckets.size > 4000) {
    const oldest = buckets.keys().next().value;
    if (oldest && oldest !== '*') buckets.delete(oldest);
  }
  return true;
}

export function sanitizeSiteFeedbackContent(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function parseSiteFeedbackCategory(value: unknown): SiteFeedbackCategory | null {
  return SITE_FEEDBACK_CATEGORIES.find((category) => category === value) ?? null;
}

export function parseSiteFeedbackPage(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const page = value.trim();
  if (!page.startsWith('/') || page.startsWith('//') || page.includes('..') || page.includes('\\')) {
    return null;
  }
  if (!/^\/[A-Za-z0-9/_-]*$/.test(page) || page.length > 80) return null;
  return page;
}
