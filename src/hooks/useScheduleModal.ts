import { useState } from 'react';
import { FlattenedSchedule } from '@/lib/schedule-formatters';

/**
 * CalendarModal의 상태 관리를 위한 커스텀 훅
 */
export const useScheduleModal = () => {
  const [editingSchedule, setEditingSchedule] =
    useState<FlattenedSchedule | null>(null);

  const toggleEditMode = (schedule: FlattenedSchedule | null) => {
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
