'use client';

import { useEffect, useState } from 'react';
import { LayoutGroup } from 'motion/react';
import ScheduleDetailModal from './ScheduleDetailModal';
import ScheduleDetailModalV2 from './ScheduleDetailModalV2';
import { useLegacyCalendarUi } from '@/hooks/useLegacyCalendarUi';
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
  const [legacyUi] = useLegacyCalendarUi();
  const [schedule, setSchedule] = useState(scheduleProp);
  const [clips, setClips] = useState(clipsProp ?? []);

  useEffect(() => {
    setSchedule(scheduleProp);
    setClips(clipsProp ?? []);
  }, [scheduleProp, clipsProp]);

  const modalProps = {
    schedule,
    clips,
    onScheduleUpdated: setSchedule,
    ...rest,
  };

  return (
    <LayoutGroup id={`schedule-modal-${schedule.id}`}>
      {legacyUi ? (
        <ScheduleDetailModal {...modalProps} />
      ) : (
        <ScheduleDetailModalV2 {...modalProps} />
      )}
    </LayoutGroup>
  );
}
