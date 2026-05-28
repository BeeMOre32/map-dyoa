// src/types/schedule-form.ts

import { Streamer, Game } from '@prisma/client';

export interface ParticipantEntry {
  id: string;
  nation: string;
  isGuest: boolean;
}

export interface SingleFormState {
  title: string;
  startTime: string;
  liveUrls: string[];
  selectedGameId: string;
  participants: ParticipantEntry[];
  isTimeTBD: boolean;
  isLiveEnded: boolean;
  isNaeJeon: boolean;
}

export interface FormErrorState {
  title?: string;
  startTime?: string;
  streamerIds?: string;
  submit?: string;
}
