'use client';

import { ThemeProvider as NextThemesProvider } from '@teispace/next-themes';
import { APP_THEME } from '@/config/theme';

type Props = {
  children: React.ReactNode;
  initialTheme?: string;
};

export function ThemeProvider({ children, initialTheme }: Props) {
  return (
    <NextThemesProvider
      attribute={APP_THEME.attribute}
      defaultTheme={APP_THEME.defaultTheme}
      enableSystem={APP_THEME.enableSystem}
      storageKey={APP_THEME.storageKey}
      themes={[...APP_THEME.themes]}
      initialTheme={initialTheme}
    >
      {children}
    </NextThemesProvider>
  );
}
