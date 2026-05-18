import { z } from 'zod';

/** Server Action·AI JSON 등에서 null / undefined / 빈 문자열 → undefined */
export function nullishStringToUndefined(val: unknown): unknown {
  return val === null ||
    val === undefined ||
    (typeof val === 'string' && !val.trim())
    ? undefined
    : val;
}

/** null / undefined → 빈 문자열 (필수 텍스트 필드용) */
export function nullishStringToEmpty(val: unknown): string {
  return typeof val === 'string' ? val : val == null ? '' : String(val);
}

export function optionalString() {
  return z.preprocess(nullishStringToUndefined, z.string().optional());
}

export function requiredString(message: string) {
  return z.preprocess(nullishStringToEmpty, z.string().min(1, message));
}

export function optionalUrlString() {
  return z.preprocess(nullishStringToUndefined, z.string().trim().url().optional());
}

export function optionalUrlOrEmptyString() {
  return z.preprocess(
    nullishStringToUndefined,
    z.string().trim().url().optional().or(z.literal('')),
  );
}

/** 배열 원소의 null·빈 문자열 제거 */
export function stringIdArray(minMessage: string) {
  return z.preprocess(
    (val) => {
      if (!Array.isArray(val)) return [];
      return val
        .map((v) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v)))
        .filter((id) => id.length > 0);
    },
    z.array(z.string()).min(1, minMessage),
  );
}

export function optionalStringArray() {
  return z.preprocess(
    (val) => {
      if (val === null || val === undefined) return undefined;
      if (!Array.isArray(val)) return undefined;
      return val
        .map((v) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v)))
        .filter(Boolean);
    },
    z.array(z.string()).optional(),
  );
}
