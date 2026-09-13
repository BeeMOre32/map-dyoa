/** 봉누도 2 — 남봉 주최 GTA5 RP 서버 (지도동 허브용) */

export const BONGNUDO2_TITLE = '봉누도 2';
export const BONGNUDO2_SEASON_KEY = 'bongnudo2';
export const BONGNUDO2_PATH = '/bongnudo';
export const BONGNUDO2_MULTIVIEW_PATH = '/bongnudo/multiview';
export const BONGNUDO2_NAMU_URL = 'https://namu.wiki/w/%EB%B4%89%EB%88%84%EB%8F%84%202';

/** 정식 서버: 2026-09-14(월) ~ 2026-10-04(일) */
export const BONGNUDO2_START_DATE = '2026-09-14';
export const BONGNUDO2_END_DATE = '2026-10-04';

/** 매주 금요일 휴일 */
export const BONGNUDO2_HOLIDAYS = ['2026-09-18', '2026-09-25', '2026-10-02'] as const;

/** 서버 운영 시각 (KST). 종료는 익일 */
export const BONGNUDO2_OPEN_HOUR = 18;
export const BONGNUDO2_CLOSE_HOUR = 3;

export const BONGNUDO2_PRE_EVENTS = [
  { date: '2026-09-12', label: '공무직 접속', note: '합격 공무직 사전 조율' },
  { date: '2026-09-13', label: '참가자 베타', note: '접속·캐릭터 생성' },
] as const;

/**
 * 나무위키 최초 입주 명단과 지도동 멤버 이름이 일치하는 인원.
 */
export const BONGNUDO2_ROSTER_NAMES = [
  '루시',
  '만득',
  '먼닉',
  '바뀐',
  '시바스',
  '위구리',
  '쵸쵸우',
  '쾅준',
  '하쁘',
] as const;

/** 봉누도 2 참가 게스트 (지도동 멤버 아님). 지금은 없음. */
export const BONGNUDO2_GUEST_NAMES = [] as const;

export type BongnudoFactionKind = 'gang' | 'org' | 'other';

export type BongnudoFaction = {
  id: string;
  label: string;
  kind: BongnudoFactionKind;
};

export type BongnudoOccupation = {
  id: string;
  label: string;
  factionId: string;
};

/** 공공·직업 집단. 이름이 정해지면 여기만 추가하면 됨. id는 저장값이니 바꾸지 말 것. */
export const BONGNUDO2_ORGS: readonly BongnudoFaction[] = [
  { id: 'city', label: '🏛️ 시청', kind: 'org' },
  { id: 'police', label: '🚓 경찰청', kind: 'org' },
  { id: 'ems', label: '🏥 병원', kind: 'org' },
  { id: 'press', label: '📺 방송국', kind: 'org' },
  { id: 'garage', label: '🔧 정비소', kind: 'org' },
  { id: 'civilian', label: '🚶 시민', kind: 'other' },
];

/** 갱단. 입주 명단이 나오면 항목만 추가하면 선택 목록에 뜸. */
export const BONGNUDO2_GANGS: readonly BongnudoFaction[] = [];

export const BONGNUDO2_FACTIONS: readonly BongnudoFaction[] = [
  ...BONGNUDO2_ORGS,
  ...BONGNUDO2_GANGS,
];

export const BONGNUDO2_OCCUPATIONS: readonly BongnudoOccupation[] = [
  { id: 'mayor', label: '🏛️ 시장', factionId: 'city' },
  { id: 'staff', label: '🗂️ 시청 직원', factionId: 'city' },
  { id: 'guide', label: '🧭 가이드', factionId: 'city' },
  { id: 'chief', label: '⭐ 경찰청장', factionId: 'police' },
  { id: 'officer', label: '🚓 경찰', factionId: 'police' },
  { id: 'hospital-director', label: '🩺 병원장', factionId: 'ems' },
  { id: 'nurse', label: '💉 간호사', factionId: 'ems' },
  { id: 'editor', label: ' rum 편집국장', factionId: 'press' },
  { id: 'reporter', label: '📰 기자', factionId: 'press' },
  { id: 'garage-boss', label: '🔑 정비 사장', factionId: 'garage' },
  { id: 'mechanic', label: '🔧 정비 기사', factionId: 'garage' },
  { id: 'civilian', label: '🚶 시민', factionId: 'civilian' },
];

export type BongnudoRosterRp = {
  name: string;
  rpName: string;
  occupation: string;
  factionId: string;
};

/**
 * 지도동 참가자만 선별한 RP. 확인된 캐릭터명만 넣고, *** 는 비움.
 * 위구리만 공무직(기자), 나머지는 시민 명단.
 */
export const BONGNUDO2_ROSTER_RP: readonly BongnudoRosterRp[] = [
  { name: '루시', rpName: '', occupation: '🚶 시민', factionId: 'civilian' },
  { name: '만득', rpName: '', occupation: '🚶 시민', factionId: 'civilian' },
  { name: '먼닉', rpName: '먼정학', occupation: '🚶 시민', factionId: 'civilian' },
  { name: '바뀐', rpName: '할리뀐', occupation: '🚶 시민', factionId: 'civilian' },
  { name: '시바스', rpName: '김건실', occupation: '🚶 시민', factionId: 'civilian' },
  { name: '위구리', rpName: '나익수', occupation: '📰 기자', factionId: 'press' },
  { name: '쵸쵸우', rpName: '의심해', occupation: '🚶 시민', factionId: 'civilian' },
  { name: '쾅준', rpName: '친게남', occupation: '🚶 시민', factionId: 'civilian' },
  { name: '하쁘', rpName: '하얼빈', occupation: '🚶 시민', factionId: 'civilian' },
];

export function bongnudoFactionById(id: string | null | undefined): BongnudoFaction | null {
  if (!id) return null;
  return BONGNUDO2_FACTIONS.find((faction) => faction.id === id) ?? null;
}

export function bongnudoFactionLabel(id: string | null | undefined): string {
  return bongnudoFactionById(id)?.label ?? '';
}

export function isBongnudoFactionId(id: string): boolean {
  return BONGNUDO2_FACTIONS.some((faction) => faction.id === id) || id === 'gov';
}

export function bongnudoRosterRpByName(name: string): BongnudoRosterRp | null {
  return BONGNUDO2_ROSTER_RP.find((row) => row.name === name) ?? null;
}

export const BONGNUDO2_CLIP_QUERY = '봉누도';
export const BONGNUDO2_CLIP_MONTHS = ['2026-09', '2026-10'] as const;

export const BONGNUDO2_PROMO_DISMISSED_KEY = 'map-dyoa:bongnudo2-promo:v1';
