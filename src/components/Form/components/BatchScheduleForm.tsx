'use client';

import { Plus } from 'lucide-react';
import ScheduleSlot from './ScheduleSlot';
import { SlotEntry, Game, Streamer } from '../types';

type BatchScheduleFormProps = {
  slots: SlotEntry[];
  expandedKey: string | null;
  sortedStreamers: Streamer[];
  games: Game[];
  onToggleExpand: (key: string) => void;
  onAddSlot: () => void;
  onRemoveSlot: (key: string) => void;
  onUpdateSlot: (key: string, updates: Partial<SlotEntry>) => void;
  onSlotLiveUrlBlur: (
    key: string,
    url: string,
    slotTitle: string,
    slotGameId: string,
    slotStreamerIds: string[],
  ) => Promise<void>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
};

export default function BatchScheduleForm({
  slots,
  expandedKey,
  sortedStreamers,
  games,
  onToggleExpand,
  onAddSlot,
  onRemoveSlot,
  onUpdateSlot,
  onSlotLiveUrlBlur,
  onSubmit,
}: BatchScheduleFormProps) {
  return (
    <form
      id="batch-create-form"
      onSubmit={onSubmit}
      noValidate
      className="flex-1 overflow-y-auto min-h-0"
    >
      <div className="p-4 md:p-6 space-y-3">
        {slots.map((slot, index) => (
          <ScheduleSlot
            key={slot.key}
            slot={slot}
            index={index}
            isExpanded={expandedKey === slot.key}
            sortedStreamers={sortedStreamers}
            games={games}
            onToggleExpand={() =>
              onToggleExpand(expandedKey === slot.key ? '' : slot.key)
            }
            onRemove={() => onRemoveSlot(slot.key)}
            onUpdate={(updates) => onUpdateSlot(slot.key, updates)}
            onLiveUrlBlur={(url) =>
              onSlotLiveUrlBlur(
                slot.key,
                url,
                slot.title,
                slot.selectedGameId,
                slot.selectedStreamerIds,
              )
            }
          />
        ))}

        <button
          type="button"
          onClick={onAddSlot}
          className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-400 dark:text-slate-500 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          일정 추가
        </button>
      </div>
    </form>
  );
}
