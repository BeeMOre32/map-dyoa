import { fetchWithBackoff } from "@/lib/map-dyoa-server-http-utils"
import { readJsonSafely, requireServerBaseUrl } from "./map-dyoa-server-fetch"

export async function fetchAllGamesFromServer() {
  const base = requireServerBaseUrl()
  const res = await fetchWithBackoff(`${base}/games`, { next: { revalidate: 120 } })
  const data = await readJsonSafely<{ games?: unknown[]; message?: string }>(
    res,
    `게임 API ${res.status}`,
  )
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
  const base = requireServerBaseUrl()
  const res = await fetchWithBackoff(`${base}/feedbacks`, { next: { revalidate: 30 } })
  const data = await readJsonSafely<{ feedbacks?: unknown[]; message?: string }>(
    res,
    `피드백 API ${res.status}`,
  )
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
