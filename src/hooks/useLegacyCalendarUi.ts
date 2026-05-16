'use client';

import { useState, useEffect } from 'react';

const KEY = 'legacyCalendarUi';
const EVENT = 'legacyCalendarUiChange';

export function useLegacyCalendarUi() {
  const [legacyUi, setLegacyUiState] = useState(false);

  useEffect(() => {
    setLegacyUiState(localStorage.getItem(KEY) === 'true');

    const handler = (e: CustomEvent<boolean>) => setLegacyUiState(e.detail);
    window.addEventListener(EVENT, handler as EventListener);
    return () => window.removeEventListener(EVENT, handler as EventListener);
  }, []);

  const setLegacyUi = (value: boolean) => {
    localStorage.setItem(KEY, String(value));
    setLegacyUiState(value);
    window.dispatchEvent(new CustomEvent<boolean>(EVENT, { detail: value }));
  };

  return [legacyUi, setLegacyUi] as const;
}
