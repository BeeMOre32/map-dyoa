import type { Game } from '@prisma/client';

export type ScheduleParticipantInput = {
  id: string;
  nation?: string;
  result?: string;
  isGuest?: boolean;
};

export type BuildScheduleActionPayloadInput = {
  title: string;
  startTime: Date;
  participants: ScheduleParticipantInput[];
  gameId?: string | null;
  gameName?: string | null;
  games?: Pick<Game, 'id' | 'title'>[];
  liveUrls?: string[];
  isGuerrilla?: boolean;
  isNaeJeon?: boolean;
  isLiveEnded?: boolean;
};

export function resolveGameId(
  gameId: string | null,
  gameName: string | null,
  games: Pick<Game, 'id' | 'title'>[],
): string | undefined {
  const trimmedId = gameId?.trim();
  if (trimmedId) return trimmedId;
  const name = gameName?.trim();
  if (!name) return undefined;
  const exact = games.find((g) => g.title === name);
  if (exact) return exact.id;
  const loose = games.find(
    (g) => g.title.includes(name) || name.includes(g.title),
  );
  return loose?.id;
}

/**
 * Server Action(createSchedule / updateSchedule)에 넘길 payload.
 * null optional 필드는 키 자체를 생략한다.
 */
export function buildScheduleActionPayload(input: BuildScheduleActionPayloadInput) {
  const participants = input.participants
    .filter((p) => typeof p.id === 'string' && p.id.trim().length > 0)
    .map(({ id, nation, result, isGuest }) => ({
      id: id.trim(),
      ...(nation?.trim() ? { nation: nation.trim() } : {}),
      ...(result?.trim() ? { result: result.trim() } : {}),
      ...(isGuest !== undefined ? { isGuest } : {}),
    }));

  const resolvedGameId =
    input.games != null
      ? resolveGameId(input.gameId ?? null, input.gameName ?? null, input.games)
      : input.gameId?.trim() || undefined;

  const liveUrls = input.liveUrls?.map((u) => u.trim()).filter(Boolean);

  return {
    title: input.title.trim(),
    startTime: input.startTime,
    participants,
    ...(resolvedGameId ? { gameId: resolvedGameId } : {}),
    ...(liveUrls && liveUrls.length > 0 ? { liveUrls } : {}),
    isGuerrilla: input.isGuerrilla ?? false,
    isNaeJeon: input.isNaeJeon ?? false,
    ...(input.isLiveEnded !== undefined ? { isLiveEnded: input.isLiveEnded } : {}),
  };
}
