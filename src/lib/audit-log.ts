import { log } from 'next-axiom';
import { getPrisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

import type { MutationAction, MutationEntity } from '@/lib/audit-log-shared';

export type {
  AuditDiffPayload,
  MutationAction,
  MutationEntity,
} from '@/lib/audit-log-shared';
export { buildAuditDiff, isAuditDiffPayload } from '@/lib/audit-log-shared';

export type AuditActor = {
  userId?: string | null;
  email?: string | null;
  role?: string | null;
};

const MAX_STR = 400;

function truncateValue(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === 'string') {
    return value.length > MAX_STR ? `${value.slice(0, MAX_STR)}…` : value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 50).map(truncateValue);
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = truncateValue(v);
    }
    return out;
  }
  return value;
}

export function actorFromSession(session: {
  user?: { id?: string; email?: string | null; role?: string | null };
} | null): AuditActor {
  return {
    userId: session?.user?.id ?? null,
    email: session?.user?.email ?? null,
    role: session?.user?.role ?? null,
  };
}

function persistAuditLog(options: {
  action: MutationAction;
  entity: MutationEntity;
  entityId?: string;
  actor?: AuditActor;
  summary: string;
  changes?: Record<string, unknown>;
}): void {
  const changes = options.changes
    ? (truncateValue(options.changes) as Record<string, unknown>)
    : undefined;

  void getPrisma()
    .auditLog.create({
      data: {
        action: options.action,
        entity: options.entity,
        entityId: options.entityId ?? null,
        summary: options.summary,
        changes: changes as Prisma.InputJsonValue | undefined,
        actorUserId: options.actor?.userId ?? null,
        actorEmail: options.actor?.email ?? null,
        actorRole: options.actor?.role ?? null,
      },
    })
    .catch((err) => {
      log.warn('audit_persist_failed', {
        entity: options.entity,
        entityId: options.entityId,
        error: err instanceof Error ? err.message : String(err),
      });
    });
}

/** 생성·수정·삭제 성공 시 Axiom + DB 이력 */
export function logMutation(options: {
  action: MutationAction;
  entity: MutationEntity;
  entityId?: string;
  actor?: AuditActor;
  summary: string;
  changes?: Record<string, unknown>;
}): void {
  const changes = options.changes
    ? (truncateValue(options.changes) as Record<string, unknown>)
    : undefined;

  log.info('mutation', {
    target: 'audit',
    action: options.action,
    entity: options.entity,
    entityId: options.entityId,
    summary: options.summary,
    changes,
    actorUserId: options.actor?.userId ?? undefined,
    actorEmail: options.actor?.email ?? undefined,
    actorRole: options.actor?.role ?? undefined,
    backend: process.env.MAP_DYOA_SERVER_URL?.trim()
      ? 'map-dyoa-server'
      : 'prisma',
  });

  persistAuditLog(options);
}

export function snapshotSchedule(data: {
  title: string;
  startTime: Date;
  participants: { id: string; nation?: string; result?: string; isGuest?: boolean }[];
  gameId?: string;
  liveUrls?: string[];
  isGuerrilla?: boolean;
  isNaeJeon?: boolean;
  isLiveEnded?: boolean;
}) {
  return {
    title: data.title.trim(),
    startTime: data.startTime.toISOString(),
    participantIds: data.participants.map((p) => p.id),
    participantCount: data.participants.length,
    gameId: data.gameId?.trim() || null,
    liveUrlCount: data.liveUrls?.filter(Boolean).length ?? 0,
    isGuerrilla: data.isGuerrilla ?? false,
    isNaeJeon: data.isNaeJeon ?? false,
    isLiveEnded: data.isLiveEnded ?? false,
  };
}

export function snapshotStreamer(data: {
  name: string;
  handle: string;
  generation: number;
  platform: string;
  isGuest?: boolean;
}) {
  return {
    name: data.name.trim(),
    handle: data.handle.trim().toLowerCase(),
    generation: data.generation,
    platform: data.platform,
    isGuest: data.isGuest ?? false,
  };
}

export function snapshotClip(data: {
  title: string;
  url: string;
  streamerIds: string[];
  scheduleId?: string;
  clipDate?: Date | null;
}) {
  return {
    title: data.title.trim(),
    url: data.url.trim(),
    streamerIds: data.streamerIds,
    scheduleId: data.scheduleId?.trim() || null,
    clipDate: data.clipDate ? data.clipDate.toISOString() : null,
  };
}

export function snapshotGame(data: { title: string; isHoi4?: boolean }) {
  return {
    title: data.title.trim(),
    isHoi4: data.isHoi4 ?? false,
  };
}

export function snapshotFeedback(data: {
  category: string;
  type?: string;
  streamerId?: string;
  streamerName?: string;
  contentLength: number;
}) {
  return {
    category: data.category,
    type: data.type ?? 'EDIT_REQUEST',
    streamerId: data.streamerId?.trim() || null,
    streamerName: data.streamerName?.trim() || null,
    contentLength: data.contentLength,
  };
}
