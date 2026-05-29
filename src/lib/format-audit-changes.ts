import { format, isValid, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { MutationEntity } from '@/lib/audit-log-shared';
import { isAuditDiffPayload } from '@/lib/audit-log-shared';

const FIELD_LABELS: Record<string, string> = {
  title: '제목',
  startTime: '시작 시각',
  participantIds: '참여 멤버',
  participantCount: '참여 인원',
  gameId: '연결 게임',
  liveUrlCount: '방송 링크',
  isGuerrilla: '시간 미정',
  isNaeJeon: '내전 모드',
  isLiveEnded: '방송 종료',
  name: '이름',
  handle: '핸들',
  generation: '기수',
  platform: '플랫폼',
  isGuest: '게스트',
  url: 'URL',
  streamerIds: '연관 멤버',
  scheduleId: '연결 일정',
  clipDate: '클립 날짜',
  isHoi4: 'HOI4',
  category: '카테고리',
  type: '유형',
  streamerId: '스트리머',
  streamerName: '스트리머 이름',
  contentLength: '내용 길이',
  status: '상태',
};

const ENTITY_LABELS: Record<MutationEntity, string> = {
  schedule: '일정',
  streamer: '스트리머',
  clip: '클립',
  game: '게임',
  feedback: '피드백',
  siteNotice: '긴급 공지',
};

const FIELD_ORDER: Partial<Record<MutationEntity, string[]>> = {
  schedule: [
    'title',
    'startTime',
    'participantIds',
    'participantCount',
    'gameId',
    'liveUrlCount',
    'isGuerrilla',
    'isNaeJeon',
    'isLiveEnded',
  ],
  streamer: ['name', 'handle', 'generation', 'platform', 'isGuest'],
  clip: ['title', 'url', 'clipDate', 'scheduleId', 'streamerIds'],
  game: ['title', 'isHoi4'],
  feedback: ['category', 'type', 'streamerName', 'contentLength', 'status'],
};

export type AuditChangeLine = { label: string; value: string };

export type AuditChangeDetail = {
  label: string;
  before: string | null;
  after: string;
  /** 이전 값이 DB에 없어 스냅샷만 있는 경우 */
  legacyOnly?: boolean;
};

export type AuditFormatContext = {
  streamerNames?: Record<string, string>;
  gameTitles?: Record<string, string>;
};

function parseChanges(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
    return null;
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return null;
}

function formatDateTime(value: unknown): string | null {
  if (value == null || value === '') return null;
  const d =
    value instanceof Date
      ? value
      : typeof value === 'string'
        ? parseISO(value)
        : null;
  if (!d || !isValid(d)) return typeof value === 'string' ? value : null;
  return format(d, 'yyyy.MM.dd (EEE) HH:mm', { locale: ko });
}

function formatBoolean(value: unknown, field: string): string {
  const on = value === true || value === 'true';
  if (field === 'isGuerrilla') return on ? '예 (시간 미정)' : '아니오';
  if (field === 'isLiveEnded') return on ? '종료됨' : '진행/예정';
  if (field === 'isNaeJeon') return on ? '내전' : '일반';
  if (field === 'isGuest') return on ? '게스트' : '멤버';
  if (field === 'isHoi4') return on ? 'HOI4' : '일반 게임';
  return on ? '예' : '아니오';
}

function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

export function getEntityLabel(entity: string): string {
  return ENTITY_LABELS[entity as MutationEntity] ?? entity;
}

function orderedFieldKeys(entity: string, keys: string[]): string[] {
  const order = FIELD_ORDER[entity as MutationEntity];
  if (!order) return keys;
  return [
    ...order.filter((k) => keys.includes(k)),
    ...keys.filter((k) => !order.includes(k)),
  ];
}

function formatParticipantIds(
  value: unknown,
  ctx?: AuditFormatContext,
): string {
  if (!Array.isArray(value) || value.length === 0) return '없음';
  const names = ctx?.streamerNames;
  const labels = value.map((id) => {
    const key = String(id);
    return names?.[key] ?? `${key.slice(0, 8)}…`;
  });
  if (labels.length <= 8) return labels.join(', ');
  return `${labels.slice(0, 8).join(', ')} 외 ${labels.length - 8}명`;
}

function diffParticipantIds(
  from: unknown,
  to: unknown,
  ctx?: AuditFormatContext,
): string | null {
  const fromArr = Array.isArray(from) ? from.map(String) : [];
  const toArr = Array.isArray(to) ? to.map(String) : [];
  const fromSet = new Set(fromArr);
  const toSet = new Set(toArr);
  const added = toArr.filter((id) => !fromSet.has(id));
  const removed = fromArr.filter((id) => !toSet.has(id));
  const names = ctx?.streamerNames;
  const label = (id: string) => names?.[id] ?? `${id.slice(0, 8)}…`;

  const parts: string[] = [];
  if (removed.length > 0) {
    parts.push(`빠짐: ${removed.map(label).join(', ')}`);
  }
  if (added.length > 0) {
    parts.push(`추가: ${added.map(label).join(', ')}`);
  }
  if (parts.length > 0) return parts.join(' · ');
  if (fromArr.length !== toArr.length) {
    return `구성 변경 (${fromArr.length}명 → ${toArr.length}명)`;
  }
  return null;
}

function formatScalar(
  value: unknown,
  field: string,
  ctx?: AuditFormatContext,
): string {
  if (value === null || value === undefined || value === '') {
    if (field === 'gameId' || field === 'scheduleId' || field === 'streamerId') {
      return '없음';
    }
    return '—';
  }

  if (typeof value === 'boolean') return formatBoolean(value, field);
  if (value === 'true' || value === 'false') return formatBoolean(value, field);

  if (field === 'startTime' || field === 'clipDate') {
    return formatDateTime(value) ?? String(value);
  }

  if (field === 'participantIds') {
    return formatParticipantIds(value, ctx);
  }

  if (field === 'streamerIds') {
    return formatParticipantIds(value, ctx);
  }

  if (field === 'participantCount') {
    return `${value}명`;
  }

  if (field === 'liveUrlCount') {
    return Number(value) === 0 ? '없음' : `${value}개`;
  }

  if (field === 'generation') {
    return `${value}기`;
  }

  if (field === 'contentLength') {
    return `${value}자`;
  }

  if (field === 'gameId') {
    const id = String(value);
    return ctx?.gameTitles?.[id] ?? (id.length > 12 ? `${id.slice(0, 10)}…` : id);
  }

  if (field === 'scheduleId' || field === 'streamerId') {
    const s = String(value);
    return s.length > 12 ? `${s.slice(0, 10)}…` : s;
  }

  if (field === 'status') {
    if (value === 'REJECTED') return '반려';
    if (value === 'RESOLVED') return '처리 완료';
    return String(value);
  }

  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return formatParticipantIds(value, ctx);

  return String(value);
}

function formatFieldPair(
  field: string,
  from: unknown,
  to: unknown,
  ctx?: AuditFormatContext,
): AuditChangeDetail | null {
  if (field === 'participantCount' && 'participantIds' in ({} as object)) {
    return null;
  }

  if (field === 'participantIds') {
    const summary = diffParticipantIds(from, to, ctx);
    const before = formatParticipantIds(from, ctx);
    const after = formatParticipantIds(to, ctx);
    if (summary) {
      return { label: fieldLabel(field), before, after: summary };
    }
    if (before === after) return null;
    return { label: fieldLabel(field), before, after };
  }

  const beforeStr = formatScalar(from, field, ctx);
  const afterStr = formatScalar(to, field, ctx);

  if (field === 'participantCount') {
    if (from === to) return null;
    return {
      label: fieldLabel(field),
      before: from == null ? null : beforeStr,
      after: afterStr,
    };
  }

  if (beforeStr === afterStr) return null;

  return {
    label: fieldLabel(field),
    before: from == null && beforeStr === '—' ? null : beforeStr,
    after: afterStr,
  };
}

function formatDiffFields(
  entity: string,
  fields: Record<string, { from: unknown; to: unknown }>,
  ctx?: AuditFormatContext,
): AuditChangeDetail[] {
  const keys = orderedFieldKeys(entity, Object.keys(fields));
  const lines: AuditChangeDetail[] = [];

  for (const key of keys) {
    if (key === 'participantCount' && 'participantIds' in fields) continue;

    const pair = fields[key];
    if (!pair) continue;

    const line = formatFieldPair(key, pair.from, pair.to, ctx);
    if (line) lines.push(line);
  }

  return lines;
}

function formatSnapshotLines(
  entity: string,
  data: Record<string, unknown>,
  ctx?: AuditFormatContext,
  legacyOnly = false,
): AuditChangeDetail[] {
  const keys = orderedFieldKeys(entity, Object.keys(data));
  const lines: AuditChangeDetail[] = [];

  for (const key of keys) {
    if (key === 'participantCount' && 'participantIds' in data) continue;

    const value = formatScalar(data[key], key, ctx);
    if (value === '—') continue;

    lines.push({
      label: fieldLabel(key),
      before: null,
      after: value,
      legacyOnly,
    });
  }

  return lines;
}

/** 수정·생성·삭제 상세 (이전 → 이후) */
export function formatAuditChangesDetail(
  entity: string,
  action: string,
  raw: unknown,
  ctx?: AuditFormatContext,
): AuditChangeDetail[] {
  if (action === 'delete') {
    return [{ label: '결과', before: null, after: '항목이 삭제되었습니다' }];
  }

  const parsed = parseChanges(raw);
  if (!parsed) return [];

  if (action === 'create') {
    const snapshot =
      isAuditDiffPayload(parsed) && parsed.after
        ? (parsed.after as Record<string, unknown>)
        : parsed;
    return formatSnapshotLines(entity, snapshot, ctx, false);
  }

  if (action === 'update' && isAuditDiffPayload(parsed)) {
    const fieldCount = Object.keys(parsed.fields).length;
    if (fieldCount > 0) {
      return formatDiffFields(entity, parsed.fields, ctx);
    }
    return formatSnapshotLines(entity, parsed.after as Record<string, unknown>, ctx, false);
  }

  if (action === 'update') {
    return formatSnapshotLines(entity, parsed, ctx, true);
  }

  return formatSnapshotLines(entity, parsed, ctx, false);
}

/** @deprecated 호환용 */
export function formatAuditChanges(
  entity: string,
  raw: unknown,
): AuditChangeLine[] {
  return formatAuditChangesDetail(entity, 'update', raw).map((d) => ({
    label: d.label,
    value: d.before && d.before !== d.after ? `${d.before} → ${d.after}` : d.after,
  }));
}
