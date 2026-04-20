import { useState } from 'react';
import { ScheduleWithParticipants } from '@/d';

/**
 * CalendarModal의 상태 관리를 위한 커스텀 훅
 */
export const useScheduleModal = () => {
  const [editingSchedule, setEditingSchedule] =
    useState<ScheduleWithParticipants | null>(null);

  const toggleEditMode = (schedule: ScheduleWithParticipants | null) => {
    setEditingSchedule(schedule);
  };

  const exitEditMode = () => {
    setEditingSchedule(null);
  };

  return {
    editingSchedule,
    toggleEditMode,
    exitEditMode,
    isEditMode: editingSchedule !== null,
  };
};
