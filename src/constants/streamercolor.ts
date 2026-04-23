export const STREAMER_COLORS: Record<string, { light: string; dark: string }> = {
  // 노랑새k — 골든 블론드 헤어
  'cmo2z3t0w000bmnx01l5aoggs': { light: '#c9a227', dark: '#f5ce58' },
  // 두뭉 — 노란 후드
  'cmo2z3t0w000amnx0menrp93v': { light: '#e07818', dark: '#f5a040' },
  // 뜨엉이 — 하늘색 강아지 캐릭터
  'cmo2z3t0w000gmnx0sy78gaq8': { light: '#2a98c8', dark: '#7bc8e8' },
  // 로션욤 — 보라색 눈, 흰 머리
  'cmo2z3t0w000hmnx0fjulhnh6': { light: '#5c42a0', dark: '#9b7fe8' },
  // 루시 — 마젠타-보라 배경, 강렬한 분위기
  'cmo2z3t0w000imnx07g43d54a': { light: '#a030c0', dark: '#d060f0' },
  // 만득 — 선명한 노란 치비
  'cmo2z3t0w0006mnx0n4iaxq1l': { light: '#c8a800', dark: '#f0d040' },
  // 먼닉 — 파란 넥타이
  'cmo2z3t0w0007mnx0jjycp125': { light: '#3a6ea8', dark: '#7aace8' },
  // 바뀐 — 선홍색 눈, 흰 머리
  'cmo2z3t0w000cmnx0l4oilzzm': { light: '#d01050', dark: '#f55880' },
  // 사모장 — 하늘색 배경
  'cmo2z3t0w0008mnx053dod1j0': { light: '#1a8aaf', dark: '#40b8d8' },
  // 시바스 — 따뜻한 브라운 톤
  'cmo2z3t0w0009mnx0xkd94tgk': { light: '#8a6840', dark: '#c0a070' },
  // 엘포나 — 블루-라벤더 헤어, 파란 눈
  'cmo2z3t0w000jmnx0e8z5e8ho': { light: '#5868c0', dark: '#9098e8' },
  // 연곰 — 보라색 리본, 곰 귀
  'cmo2z3t0w000kmnx0kfmgq6vv': { light: '#8050c0', dark: '#b888f0' },
  // 위구리 — 다크 마룬 배경, 군복
  'cmo2yw22u0000mnx00xuzn2k3': { light: '#882030', dark: '#d04868' },
  // 이늘 — 핑크 트윈테일, 붉은 눈
  'cmo2z3t0w000lmnx07p1vcdye': { light: '#e82060', dark: '#f86090' },
  // 자두뇨끼 — 전체 파스텔 핑크
  'cmo2z3t0w000mmnx0x9jfyub8': { light: '#d84080', dark: '#f08ab0' },
  // 쵸쵸우 — 크림/골든 헤어, 호박색 눈
  'cmo2z3t0w000dmnx04jpj5uu1': { light: '#c08030', dark: '#e8b868' },
  // 카코이 유이 — 라벤더 헤어
  'cmo2z3t0w000emnx0i2cwktrr': { light: '#9050d8', dark: '#c090f8' },
  // 쾅준 — 어두운 베레모 치비
  'cmo2z3t0w0005mnx0umhkkd73': { light: '#486898', dark: '#80a8d0' },
  // 티아나 스이 — 흰 머리, 아이스블루 눈
  'cmo2z3t0w000nmnx0ky30nopu': { light: '#2898c8', dark: '#70c8f0' },
  // 하루나엘 — 검은 헤어에 붉은 포인트
  'cmo2z3t0w000omnx0h7ue8nrc': { light: '#b02848', dark: '#e06080' },
  // 하쁘 — 핑크-블론드 헤어, 보라 눈
  'cmo2z3t0w000fmnx0grko81sw': { light: '#b040d8', dark: '#d880f8' },
};

export function getStreamerColor(id: string, isDark: boolean): string | null {
  const entry = STREAMER_COLORS[id];
  if (!entry) return null;
  return isDark ? entry.dark : entry.light;
}
