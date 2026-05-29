/** 클라이언트·서버 공용 — Prisma/Node 전용 모듈 import 금지 */

export type MutationAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'reject'
  | 'resolve'
  | 'bulk_create';

export type MutationEntity =
  | 'schedule'
  | 'streamer'
  | 'clip'
  | 'game'
  | 'feedback'
  | 'siteNotice';

export type AuditDiffPayload = {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  fields: Record<string, { from: unknown; to: unknown }>;
};

function normalizeForCompare(value: unknown): unknown {
  if (Array.isArray(value)) {
    return [...value].map(String).sort();
  }
  return value;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  return (
    JSON.stringify(normalizeForCompare(a)) === JSON.stringify(normalizeForCompare(b))
  );
}

export function buildAuditDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): AuditDiffPayload {
  const fields: Record<string, { from: unknown; to: unknown }> = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    if (!valuesEqual(before[key], after[key])) {
      fields[key] = { from: before[key] ?? null, to: after[key] ?? null };
    }
  }
  return { before, after, fields };
}

export function isAuditDiffPayload(raw: unknown): raw is AuditDiffPayload {
  return (
    raw != null &&
    typeof raw === 'object' &&
    'fields' in raw &&
    'before' in raw &&
    'after' in raw
  );
}
