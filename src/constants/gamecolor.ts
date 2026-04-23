// 1. hearts of iron 4
// 2. civilization 6
// 3. various games
// 4. crusader kings 3
// 5. board games
export const GAME_COLORS: Record<string, { light: string; dark: string }> = {
  '1': { light: '#501f22', dark: '#c9666b' },
  '2': { light: '#b07d0e', dark: '#f5c842' },
  '3': { light: '#1e4e8c', dark: '#5b9bd5' },
  '4': { light: '#483d8b', dark: '#9b8fd4' },
  '5': { light: '#1e7c4c', dark: '#4dba84' },
};

export function getGameColor(id: string, isDark: boolean): string | null {
  const entry = GAME_COLORS[id];
  if (!entry) return null;
  return isDark ? entry.dark : entry.light;
}
