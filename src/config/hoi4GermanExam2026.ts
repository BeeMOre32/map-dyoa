/**
 * 제1회 공식 지도동 대회 — HOI4 독일 호이고사
 * 참가 멤버·출발 시각은 DB 캘린더 일정(제목에 `호이고사` 포함)에서 자동 연동.
 * `eventStaff`는 일정 participants에 있어도 선수 명단·랭킹에서 제외하고 카드에 표시.
 * 클리어 기록은 DB `Hoi4ExamEntry` + 로그인 사용자 수동 등록.
 * 경과 타이머는 운영 제어에서 수동 출발.
 */

export type Hoi4GermanExamEntry = {
  streamerId: string;
  /** 게임 내 STOP 시점 — YYYY-MM-DD (예: 1941-08-04) */
  clearGameDate?: string;
  /** 출발~클리어 플레이 시간(ms) */
  playTimeMs?: number;
  /** 클리어 시각 KST — HH:mm */
  clearedAtKst?: string;
  vodUrl?: string;
};

export type Hoi4ExamStaffRole = 'broadcast' | 'helper';

export type Hoi4ExamStaffMember = {
  streamerId: string;
  role: Hoi4ExamStaffRole;
};

export type Hoi4GermanExamConfig = {
  title: string;
  subtitle: string;
  /** 캘린더 일정 제목 매칭 키워드 */
  scheduleTitleIncludes: readonly string[];
  /** 운영진 — 일정 participants에 있어도 선수 명단·랭킹에서 제외하고 카드에 표시 */
  eventStaff: readonly Hoi4ExamStaffMember[];
  /** 운영진 외 추가 제외가 필요할 때 사용 */
  excludedStreamerIds: readonly string[];
  nation: string;
  rules: readonly string[];
  stopCriteria: readonly string[];
  entries: readonly Hoi4GermanExamEntry[];
};

export const HOI4_GERMAN_EXAM_2026: Hoi4GermanExamConfig = {
  title: 'HOI4 독일 호이고사',
  subtitle: '제1회 공식 지도동 대회',
  scheduleTitleIncludes: ['호이고사'],
  eventStaff: [
    { streamerId: 'cmo2yw22u0000mnx00xuzn2k3', role: 'broadcast' }, // 위구리
    { streamerId: 'cmo2z3t0w0005mnx0umhkkd73', role: 'broadcast' }, // 쾅준
    { streamerId: 'cmo2z3t0w0007mnx0jjycp125', role: 'helper' }, // 먼닉
    { streamerId: 'cmo2z3t0w0009mnx0xkd94tgk', role: 'helper' }, // 시바스
  ],
  excludedStreamerIds: [],
  nation: '독일',
  rules: [
    'HOI4 싱글 스피드런 — 플레이 국가 독일 고정',
    '공산주의 진영(소련)과 평화 조약 체결 순서로 순위 결정',
    '네덜란드·폴란드 조기 침공, 비역사 루트 등 자유',
  ],
  stopCriteria: [
    'STOP: 영국·프랑스·소련과 동시에 전쟁 중인 상태에서 소련(공산주의 진영) 항복',
    '소련 전쟁 선포 전에 영국·프랑스와 전쟁을 먼저 선포해야 함',
    '영국·프랑스는 항복할 필요 없음 (전쟁 중이면 OK)',
  ],
  entries: [],
};
