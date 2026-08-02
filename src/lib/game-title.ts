/** 게임 제목 정규화·유사 매칭 (공백/기호 무시) */

export function normalizeGameTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '');
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    let prev = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cur =
        a[i] === b[j]
          ? row[j]
          : 1 + Math.min(row[j], row[j + 1], prev);
      row[j] = prev;
      prev = cur;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}

/** 동일·매우 유사한 게임 찾기. 없으면 null */
export function findSimilarGame<T extends { id: string; title: string }>(
  title: string,
  games: T[],
): T | null {
  const needle = normalizeGameTitle(title);
  if (!needle) return null;

  const exact = games.find((g) => normalizeGameTitle(g.title) === needle);
  if (exact) return exact;

  const contains = games
    .map((g) => ({ g, n: normalizeGameTitle(g.title) }))
    .filter(
      ({ n }) =>
        n.length >= 3 &&
        needle.length >= 3 &&
        (n.includes(needle) || needle.includes(n)),
    )
    .sort(
      (a, b) =>
        Math.abs(a.n.length - needle.length) -
        Math.abs(b.n.length - needle.length),
    );
  if (contains[0]) return contains[0].g;

  let best: T | null = null;
  let bestDist = Infinity;
  const maxDist = needle.length <= 4 ? 1 : needle.length <= 8 ? 2 : 3;
  for (const g of games) {
    const n = normalizeGameTitle(g.title);
    if (!n) continue;
    const d = levenshtein(needle, n);
    if (d <= maxDist && d < bestDist) {
      bestDist = d;
      best = g;
    }
  }
  return best;
}

/** 정규화 키가 같은 게임 묶음 (2개 이상만) — 관리자 정리용 */
export function groupGamesBySimilarTitle<T extends { id: string; title: string }>(
  games: T[],
): { key: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  for (const g of games) {
    const key = normalizeGameTitle(g.title) || g.id;
    const list = map.get(key) ?? [];
    list.push(g);
    map.set(key, list);
  }
  return [...map.entries()]
    .filter(([, items]) => items.length > 1)
    .map(([key, items]) => ({ key, items }))
    .sort((a, b) => b.items.length - a.items.length);
}
