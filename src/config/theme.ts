export const APP_THEME = {
  attribute: 'class' as const,
  defaultTheme: 'light',
  enableSystem: true,
  storageKey: 'theme',
  themes: ['light', 'dark'] as const,
};
