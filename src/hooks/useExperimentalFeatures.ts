'use client';

import { useState, useEffect } from 'react';

export type ExperimentalFlags = {
  showHoi4Tab: boolean;
  newScheduleModal: boolean;
  newCalendarUI: boolean;
};

const DEFAULTS: ExperimentalFlags = {
  showHoi4Tab: false,
  newScheduleModal: false,
  newCalendarUI: false,
};

const KEY = 'experimentalFeatures';
const EVENT = 'experimentalFeaturesChange';

function load(): ExperimentalFlags {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(flags: ExperimentalFlags) {
  localStorage.setItem(KEY, JSON.stringify(flags));
  window.dispatchEvent(new CustomEvent<ExperimentalFlags>(EVENT, { detail: flags }));
}

export function useExperimentalFeatures() {
  const [flags, setFlagsState] = useState<ExperimentalFlags>({ ...DEFAULTS });

  useEffect(() => {
    setFlagsState(load());
    const handler = (e: CustomEvent<ExperimentalFlags>) => setFlagsState(e.detail);
    window.addEventListener(EVENT, handler as EventListener);
    return () => window.removeEventListener(EVENT, handler as EventListener);
  }, []);

  const setFlag = <K extends keyof ExperimentalFlags>(key: K, value: ExperimentalFlags[K]) => {
    const next = { ...flags, [key]: value };
    setFlagsState(next);
    save(next);
  };

  return { flags, setFlag };
}
