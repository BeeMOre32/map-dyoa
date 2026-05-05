// CHZZK liveCategory 문자열 → 내부 Game ID 매핑
// 콘솔에서 [live-meta].category 값을 확인하고 추가/수정하세요
export const CHZZK_GAME_MAP: { category: string; gameId: string }[] = [
  // Hearts of Iron IV (id: 1)
  { category: '하츠 오브 아이런 4', gameId: '1' },
  { category: '하츠오브아이런4', gameId: '1' },
  { category: 'Hearts of Iron IV', gameId: '1' },

  // Civilization VI (id: 2)
  { category: '문명 VI', gameId: '2' },
  { category: '문명 6', gameId: '2' },
  { category: '시드 마이어의 문명 VI', gameId: '2' },
  { category: "Sid Meier's Civilization VI", gameId: '2' },

  // Crusader Kings III (id: 4)
  { category: '크루세이더 킹즈 3', gameId: '4' },
  { category: 'Crusader Kings III', gameId: '4' },
];

export function matchChzzkCategory(category: string): string | null {
  const lower = category.toLowerCase();
  const match = CHZZK_GAME_MAP.find((m) => m.category.toLowerCase() === lower);
  return match?.gameId ?? null;
}
