export type BuildClipActionPayloadInput = {
  title: string;
  url: string;
  streamerIds: string[];
  scheduleId?: string | null;
  thumbnailUrl?: string | null;
  description?: string | null;
  clipDate?: Date;
};

/** Server Action(createClip / updateClip)에 넘길 payload */
export function buildClipActionPayload(input: BuildClipActionPayloadInput) {
  const streamerIds = input.streamerIds.filter(
    (id) => typeof id === 'string' && id.trim().length > 0,
  );

  return {
    title: input.title.trim(),
    url: input.url.trim(),
    streamerIds,
    ...(input.scheduleId?.trim() ? { scheduleId: input.scheduleId.trim() } : {}),
    ...(input.thumbnailUrl?.trim() ? { thumbnailUrl: input.thumbnailUrl.trim() } : {}),
    ...(input.description?.trim() ? { description: input.description.trim() } : {}),
    ...(input.clipDate ? { clipDate: input.clipDate } : {}),
  };
}
