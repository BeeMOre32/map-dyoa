import { bongnudoRosterRpByName } from '@/config/bongnudo2';

export type BongnudoProfileView = {
  streamerId: string;
  rpName: string;
  occupation: string;
  factionId: string;
  concept: string;
  notes: string;
  updatedAt: string | null;
};

export type BongnudoProfileInput = {
  streamerId: string;
  rpName: string;
  occupation: string;
  factionId: string;
  concept: string;
  notes: string;
};

export function emptyBongnudoProfile(streamerId: string): BongnudoProfileView {
  return {
    streamerId,
    rpName: '',
    occupation: '',
    factionId: '',
    concept: '',
    notes: '',
    updatedAt: null,
  };
}

export function hydrateBongnudoProfile(raw: Record<string, unknown>): BongnudoProfileView {
  return {
    streamerId: String(raw.streamerId ?? ''),
    rpName: typeof raw.rpName === 'string' ? raw.rpName : '',
    occupation: typeof raw.occupation === 'string' ? raw.occupation : '',
    factionId: typeof raw.factionId === 'string' ? raw.factionId : '',
    concept: typeof raw.concept === 'string' ? raw.concept : '',
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
  };
}

/** 저장된 값이 비어 있으면 명단에서 선별한 RP를 채움 */
export function mergeBongnudoProfile(
  streamerName: string,
  saved: BongnudoProfileView | null | undefined,
  streamerId: string,
): BongnudoProfileView {
  const seed = bongnudoRosterRpByName(streamerName);
  const base = saved ?? emptyBongnudoProfile(streamerId);
  return {
    ...base,
    rpName: base.rpName || seed?.rpName || '',
    occupation: base.occupation || seed?.occupation || '',
    factionId: base.factionId === 'gov' ? 'city' : base.factionId || seed?.factionId || '',
  };
}
