'use client';

import { useEffect, useState } from 'react';

const KEY = 'clipWeeklyBeta';
const EVENT = 'clipWeeklyBetaChange';

export function useClipWeeklyBeta() {
  const [enabled, setEnabledState] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    setEnabledState(stored === null ? true : stored === 'true');

    const handler = (event: Event) => {
      setEnabledState((event as CustomEvent<boolean>).detail);
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  const setEnabled = (value: boolean) => {
    localStorage.setItem(KEY, String(value));
    setEnabledState(value);
    window.dispatchEvent(new CustomEvent<boolean>(EVENT, { detail: value }));
  };

  return [enabled, setEnabled] as const;
}
