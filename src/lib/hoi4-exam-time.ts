/** KST datetime-local ↔ ISO 변환·표시 */

export function isValidDate(date: Date): boolean {
  return date instanceof Date && Number.isFinite(date.getTime());
}

export function kstDateKey(date: Date): string {
  if (!isValidDate(date)) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function formatKstTimeLabel(date: Date): string {
  if (!isValidDate(date)) return '—';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';
  return `${hour}:${minute}`;
}

export function formatKstDateLabel(date: Date): string {
  if (!isValidDate(date)) return '—';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
}

export function formatKstDateTime(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

function kstDatetimeParts(iso: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso));
}

export function isoToKstDatetimeLocal(iso: string, withSeconds = true): string {
  const parts = kstDatetimeParts(iso);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '00';

  const base = `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
  return withSeconds ? `${base}:${get('second')}` : base;
}

export function kstDatetimeLocalToIso(local: string): string {
  const trimmed = local.trim();
  const withSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(trimmed);
  const withoutSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed);

  if (!withSeconds && !withoutSeconds) {
    throw new Error('시각 형식이 올바르지 않습니다. (YYYY-MM-DDTHH:mm[:ss])');
  }

  const parsed = new Date(
    withSeconds ? `${trimmed}+09:00` : `${trimmed}:00+09:00`,
  );
  if (!Number.isFinite(parsed.getTime())) {
    throw new Error('유효하지 않은 시각입니다.');
  }
  return parsed.toISOString();
}

export function shiftPlayTimeParts(
  hours: number,
  minutes: number,
  seconds: number,
  deltaSeconds: number,
): { hours: number; minutes: number; seconds: number } {
  const total = Math.max(0, hours * 3600 + minutes * 60 + seconds + deltaSeconds);
  return {
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}
