'use client';

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

export default function ScheduleDetailModalWrapper(props: Props) {
  const { flags } = useExperimentalFeatures();
  return flags.newScheduleModal
    ? <ScheduleDetailModalV2 {...props} />
    : <ScheduleDetailModal {...props} />;
}
