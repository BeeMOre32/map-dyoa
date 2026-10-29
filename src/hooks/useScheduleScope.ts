'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  readScheduleScope,
  writeScheduleScope,
  type ScheduleScope,
} from '@/lib/schedule-scope';

export function useScheduleScope() {
  const [scope, setScopeState] = useState<ScheduleScope>('both');

  useEffect(() => {
    writeScheduleScope(readScheduleScope());
    setScopeState(readScheduleScope());
  }, []);

  const setScope = useCallback((next: ScheduleScope) => {
    setScopeState(next);
    writeScheduleScope(next);
  }, []);

  return [scope, setScope] as const;
}
