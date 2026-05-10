import { Game, Streamer } from '@prisma/client';

export interface SlotErrors {
  title?: string;
  startTime?: string;
  streamerIds?: string;
}

export interface SlotEntry {
  key: string;
  title: string;
  startTime: string;
  selectedGameId: string;
  selectedStreamerIds: string[];
  guestStreamerIds: string[];
  liveUrls: string[];
  isTimeTBD: boolean;
  metaLoading: boolean;
  autoFilled: string[];
  errors: SlotErrors;
}

export interface BatchFormProps {
  slots: SlotEntry[];
  games: Game[];
  streamers: Streamer[];
  expandedKey: string | null;
  setExpandedKey: (key: string | null) => void;
  updateSlot: (key: string, updates: Partial<SlotEntry>) => void;
  removeSlot: (key: string) => void;
  addSlot: () => void;
  handleSlotLiveUrlBlur: (key: string, url: string, slot: SlotEntry) => void;
  handleBatchSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  batchSubmitError: string | null;
  onClose: () => void;
}
