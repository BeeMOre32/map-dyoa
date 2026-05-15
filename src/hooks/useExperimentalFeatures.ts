'use client';

import { useState, useEffect } from 'react';
import { track } from '@vercel/analytics';

export type ExperimentalFlags = {
  newScheduleModal: boolean;
  newCalendarUI: boolean;
};

export const EXPERIMENTAL_FEATURE_ANALYTICS_KEY: Record<keyof ExperimentalFlags, string> = {
  newScheduleModal: 'new_schedule_modal',
  newCalendarUI: 'new_calendar_ui',
};

const DEFAULTS: ExperimentalFlags = {
  newScheduleModal: true,
  newCalendarUI: true,
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
    if (flags[key] === value) return;
    const next = { ...flags, [key]: value };
    track('experimental_feature_set', {
      feature: EXPERIMENTAL_FEATURE_ANALYTICS_KEY[key],
      enabled: value ? 1 : 0,
    });
    setFlagsState(next);
    save(next);
  };

  return { flags, setFlag };
}
