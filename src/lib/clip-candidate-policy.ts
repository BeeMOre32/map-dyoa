/** 클립 후보 기준. UI 문구와 스캔이 같이 쓴다. */
export const CLIP_CANDIDATE_MIN_READ_COUNT = 1000;
export const CLIP_CANDIDATE_WINDOW_DAYS = 14;
export const CLIP_CANDIDATE_MAX_NEW_PER_CHANNEL = 3;

export type ClipCandidateScanResult = {
  channels: number;
  created: number;
  refreshed: number;
  linkedExisting: number;
  purged: number;
};

export type ClipCandidateView = {
  id: string;
  url: string;
  title: string;
  thumbnailUrl: string | null;
  readCount: number;
  streamerId: string;
  streamerName: string;
  clipDate: string | null;
  lastSeenAt: string;
};
