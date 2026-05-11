import { getScheduleServerBaseUrl } from "./map-dyoa-server-schedules"

export async function fetchAllGamesFromServer() {
  const base = getScheduleServerBaseUrl()
  if (!base) throw new Error("MAP_DYOA_SERVER_URL이 설정되지 않았습니다.")
  const res = await fetch(`${base}/games`, { next: { revalidate: 120 } })
  const data = (await res.json()) as { games?: unknown[]; message?: string }
  if (!res.ok) throw new Error(data.message ?? `게임 API ${res.status}`)
  if (!Array.isArray(data.games)) return []
  return (data.games as Array<Record<string, unknown>>).map((g) => ({
    id: String(g.id),
    title: String(g.title),
    isHoi4: Boolean(g.isHoi4),
    _count: {
      schedules: Number(
        (g._count as { schedules?: unknown } | undefined)?.schedules ?? 0,
      ),
    },
  }))
}

export async function fetchFeedbacksFromServer() {
  const base = getScheduleServerBaseUrl()
  if (!base) throw new Error("MAP_DYOA_SERVER_URL이 설정되지 않았습니다.")
  const res = await fetch(`${base}/feedbacks`, { next: { revalidate: 30 } })
  const data = (await res.json()) as { feedbacks?: unknown[]; message?: string }
  if (!res.ok) throw new Error(data.message ?? `피드백 API ${res.status}`)
  if (!Array.isArray(data.feedbacks)) return []
  return data.feedbacks as Array<{
    id: string
    status: string
    category: string
    streamerName: string | null
    content: string
    createdAt: string | Date
  }>
}
