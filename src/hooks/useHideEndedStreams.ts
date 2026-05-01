'use client';

import { useState, useEffect } from 'react';

const KEY = 'hideEndedStreams';
const EVENT = 'hideEndedStreamsChange';

export function useHideEndedStreams() {
  const [hideEnded, setHideEndedState] = useState(false);

  useEffect(() => {
    setHideEndedState(localStorage.getItem(KEY) === 'true');

    const handler = (e: CustomEvent<boolean>) => setHideEndedState(e.detail);
    window.addEventListener(EVENT, handler as EventListener);
    return () => window.removeEventListener(EVENT, handler as EventListener);
  }, []);

  const setHideEnded = (value: boolean) => {
    localStorage.setItem(KEY, String(value));
    setHideEndedState(value);
    window.dispatchEvent(new CustomEvent<boolean>(EVENT, { detail: value }));
  };

  return [hideEnded, setHideEnded] as const;
}
