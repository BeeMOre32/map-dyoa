/** 월별 Wrapped 스타일 그라데이션 (0 = 1월) */
const MONTH_THEMES = [
  { from: '#0f172a', via: '#1e3a8a', to: '#38bdf8', accent: '#7dd3fc' },
  { from: '#4c0519', via: '#be123c', to: '#fda4af', accent: '#fecdd3' },
  { from: '#052e16', via: '#15803d', to: '#86efac', accent: '#bbf7d0' },
  { from: '#422006', via: '#ca8a04', to: '#fde047', accent: '#fef08a' },
  { from: '#312e81', via: '#6366f1', to: '#c4b5fd', accent: '#ddd6fe' },
  { from: '#083344', via: '#0891b2', to: '#67e8f9', accent: '#a5f3fc' },
  { from: '#431407', via: '#ea580c', to: '#fdba74', accent: '#fed7aa' },
  { from: '#451a03', via: '#d97706', to: '#fcd34d', accent: '#fde68a' },
  { from: '#042f2e', via: '#0d9488', to: '#5eead4', accent: '#99f6e4' },
  { from: '#431407', via: '#c2410c', to: '#fb923c', accent: '#fdba74' },
  { from: '#3b0764', via: '#7e22ce', to: '#d8b4fe', accent: '#e9d5ff' },
  { from: '#0c1844', via: '#4338ca', to: '#818cf8', accent: '#c7d2fe' },
] as const;

export type MonthlyWrapperTheme = (typeof MONTH_THEMES)[number];

export function getMonthlyWrapperTheme(date: Date): MonthlyWrapperTheme {
  return MONTH_THEMES[date.getMonth()] ?? MONTH_THEMES[0];
}

export function monthlyWrapperGradient(theme: MonthlyWrapperTheme) {
  return `linear-gradient(145deg, ${theme.from} 0%, ${theme.via} 42%, ${theme.to} 100%)`;
}

/** 히어로·페이지 배경용 메시 그라데이션 */
export function monthlyWrapperMesh(theme: MonthlyWrapperTheme) {
  return `
    radial-gradient(ellipse 80% 60% at 10% 0%, ${theme.accent}33 0%, transparent 55%),
    radial-gradient(ellipse 70% 50% at 90% 100%, ${theme.to}28 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 50% 50%, ${theme.via}18 0%, transparent 70%)
  `;
}

export function monthlyWrapperGlow(theme: MonthlyWrapperTheme) {
  return `0 0 80px ${theme.accent}44, 0 24px 64px -16px ${theme.from}88`;
}
