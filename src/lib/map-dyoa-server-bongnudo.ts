/**
 * map-dyoa-server 봉누도 RP API (`MAP_DYOA_SERVER_URL`).
 */

import { BONGNUDO2_SEASON_KEY } from '@/config/bongnudo2';
import { fetchWithBackoff } from '@/lib/map-dyoa-server-http-utils';
import {
  apiMutationMessage,
  readApiJson,
  readJsonSafely,
  requireServerBaseUrl,
  type ApiJson,
} from '@/lib/map-dyoa-server-fetch';
import {
  hydrateBongnudoProfile,
  type BongnudoProfileInput,
  type BongnudoProfileView,
} from '@/lib/bongnudo-profiles';
import { getScheduleServerBaseUrl } from '@/lib/map-dyoa-server-schedules';

export async function fetchBongnudoProfilesFromServer(
  seasonKey = BONGNUDO2_SEASON_KEY,
): Promise<BongnudoProfileView[]> {
  if (!getScheduleServerBaseUrl()) return [];

  const base = requireServerBaseUrl();
  const qs = new URLSearchParams({ season: seasonKey });
  const res = await fetchWithBackoff(`${base}/bongnudo/profiles?${qs.toString()}`, {
    next: { revalidate: 30, tags: ['bongnudo'] },
  });
  if (res.status === 404) return [];
  const data = await readJsonSafely<{ profiles?: unknown[]; message?: string }>(
    res,
    `봉누도 RP API ${res.status}`,
  );
  if (!Array.isArray(data.profiles)) return [];
  return (data.profiles as Record<string, unknown>[]).map(hydrateBongnudoProfile);
}

type MutationFail = { ok: false; status: number; json: ApiJson };

export async function upsertBongnudoProfileOnServer(
  input: BongnudoProfileInput,
  actorUserId: string | null,
  seasonKey = BONGNUDO2_SEASON_KEY,
): Promise<{ ok: true; profile: BongnudoProfileView } | MutationFail> {
  const base = requireServerBaseUrl();
  const res = await fetchWithBackoff(
    `${base}/bongnudo/profiles/${encodeURIComponent(input.streamerId)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seasonKey,
        rpName: input.rpName,
        occupation: input.occupation,
        factionId: input.factionId,
        concept: input.concept,
        notes: input.notes,
        updatedByUserId: actorUserId ?? undefined,
      }),
    },
  );
  const json = await readApiJson(res);
  if (!res.ok || !json.profile || typeof json.profile !== 'object') {
    return { ok: false, status: res.status, json };
  }
  return {
    ok: true,
    profile: hydrateBongnudoProfile(json.profile as Record<string, unknown>),
  };
}

export function bongnudoMutationMessage(status: number, json: ApiJson): string {
  return apiMutationMessage(status, json, 'RP 정보 저장에 실패했습니다.');
}
