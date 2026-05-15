'use client';

import { useEffect, useState } from 'react';
import { useExperimentalFeatures } from '@/hooks/useExperimentalFeatures';
import ScheduleDetailModal from './ScheduleDetailModal';
import ScheduleDetailModalV2 from './ScheduleDetailModalV2';
import type { Streamer, Game } from '@prisma/client';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';
import type { ClipForSchedule } from './ScheduleSidePanel';

interface Props {
  schedule: FlattenedSchedule;
  streamers: Streamer[];
  games: Game[];
  clips?: ClipForSchedule[];
}

export default function ScheduleDetailModalWrapper({
  schedule: scheduleProp,
  clips: clipsProp,
  ...rest
}: Props) {
  const { flags } = useExperimentalFeatures();
  const [schedule, setSchedule] = useState(scheduleProp);
  const [clips, setClips] = useState(clipsProp ?? []);

  useEffect(() => {
    setSchedule(scheduleProp);
    setClips(clipsProp ?? []);
  }, [scheduleProp, clipsProp]);

  const modalProps = { schedule, clips, ...rest };

  return flags.newScheduleModal ? (
    <ScheduleDetailModalV2 {...modalProps} />
  ) : (
    <ScheduleDetailModal {...modalProps} />
  );
}
