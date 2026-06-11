/**
 * 제1회 공식 지도동 대회 — HOI4 독일 호이고사
 * 참가 멤버는 `scheduleId` 일정의 participants에서 자동 연동 (`excludedStreamerIds` 제외).
 * 클리어 기록은 DB `Hoi4ExamEntry` + 페이지에서 로그인 사용자가 수동 등록.
 * 출발·경과 타이머는 7시 자동이 아니라 페이지「운영 제어」에서 로그인 사용자가 수동 시작.
 */

export type Hoi4GermanExamEntry = {
  streamerId: string;
  /** 게임 내 STOP 시점 — YYYY-MM-DD (예: 1941-08-04) */
  clearGameDate?: string;
  /** 출발(19:00)~클리어 플레이 시간(ms) */
  playTimeMs?: number;
  /** 클리어 시각 KST — HH:mm */
  clearedAtKst?: string;
  vodUrl?: string;
};

export const HOI4_GERMAN_EXAM_2026 = {
  id: '2026-06-16',
  title: 'HOI4 독일 호이고사',
  subtitle: '제1회 공식 지도동 대회',
  /** 캘린더 일정「호이고사」— 참가 멤버·출발 시각 연동 */
  scheduleId: 'r1x7jak36bqn46kq9ah3pze1',
  /** 중계진 — 일정 participants에 있어도 명단·랭킹에서 제외 */
  excludedStreamerIds: [
    'cmo2yw22u0000mnx00xuzn2k3', // 위구리
    'cmo2z3t0w0005mnx0umhkkd73', // 쾅준
    'cmo2z3t0w0009mnx0xkd94tgk', // 시바스
  ],
  eventDate: '2026-06-16',
  scheduleTitleIncludes: ['호이고사'],
  /** 일정 미연동 시 폴백 */
  startAtKst: '2026-06-16T19:00:00+09:00',
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
  /** 폴백용 — 실제 기록은 DB */
  entries: [] as Hoi4GermanExamEntry[],
} as const;
