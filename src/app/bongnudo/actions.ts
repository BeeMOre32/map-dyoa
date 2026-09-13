'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { requireAuth } from '@/lib/auth-helpers';
import { actorFromSession, buildAuditDiff, logMutation } from '@/lib/audit-log';
import { getAllStreamers } from '@/lib/data-fetching';
import { splitBongnudoStreamers } from '@/lib/bongnudo';
import {
  emptyBongnudoProfile,
  type BongnudoProfileView,
} from '@/lib/bongnudo-profiles';
import {
  bongnudoMutationMessage,
  fetchBongnudoProfilesFromServer,
  upsertBongnudoProfileOnServer,
} from '@/lib/map-dyoa-server-bongnudo';
import { bongnudoProfileSchema } from '@/lib/schemas';
import { BONGNUDO2_PATH } from '@/config/bongnudo2';
import { getScheduleServerBaseUrl } from '@/lib/map-dyoa-server-schedules';
import { getErrorMessage } from '@/lib/error-handling';
import type { ActionResult } from '@/types/api-response';

export async function upsertBongnudoProfileAction(
  raw: unknown,
): Promise<ActionResult<BongnudoProfileView>> {
  try {
    const session = await requireAuth();
    if (!getScheduleServerBaseUrl()) {
      return {
        success: false,
        error: 'map-dyoa-server가 연결되어 있지 않습니다.',
        errorCode: 'SERVER_ERROR',
      };
    }

    const parsed = bongnudoProfileSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.',
        errorCode: 'VALIDATION_ERROR',
      };
    }

    const streamers = await getAllStreamers();
    const roster = splitBongnudoStreamers(streamers);
    const allowed = new Set(
      [...roster.members, ...roster.guests].map((person) => person.id),
    );
    if (!allowed.has(parsed.data.streamerId)) {
      return {
        success: false,
        error: '봉누도 2 참가 명단에 없는 방송인입니다.',
        errorCode: 'FORBIDDEN',
      };
    }

    const current =
      (await fetchBongnudoProfilesFromServer()).find(
        (row) => row.streamerId === parsed.data.streamerId,
      ) ?? emptyBongnudoProfile(parsed.data.streamerId);

    const saved = await upsertBongnudoProfileOnServer(parsed.data, session.user.id);
    if (!saved.ok) {
      return {
        success: false,
        error: bongnudoMutationMessage(saved.status, saved.json),
        errorCode: String(saved.json.error ?? 'API_ERROR'),
      };
    }

    await Promise.all([
      revalidatePath(BONGNUDO2_PATH),
      updateTag('bongnudo'),
    ]);

    logMutation({
      action: current.updatedAt ? 'update' : 'create',
      entity: 'bongnudoProfile',
      entityId: parsed.data.streamerId,
      actor: actorFromSession(session),
      summary: `봉누도 RP 수정: ${parsed.data.rpName || parsed.data.streamerId}`,
      changes: buildAuditDiff(
        {
          rpName: current.rpName,
          occupation: current.occupation,
          factionId: current.factionId,
          concept: current.concept,
          notes: current.notes,
        },
        {
          rpName: saved.profile.rpName,
          occupation: saved.profile.occupation,
          factionId: saved.profile.factionId,
          concept: saved.profile.concept,
          notes: saved.profile.notes,
        },
      ),
    });

    return { success: true, data: saved.profile };
  } catch (error) {
    const { message, code } = getErrorMessage(error);
    return { success: false, error: message, errorCode: code };
  }
}
