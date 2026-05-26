import { fetchWithBackoff } from "@/lib/map-dyoa-server-http-utils"
import { readJsonSafely, requireServerBaseUrl } from "./map-dyoa-server-fetch"

async function fetchJson<T>(path: string, revalidate = 60): Promise<T> {
  const base = requireServerBaseUrl()
  const res = await fetchWithBackoff(`${base}${path}`, { next: { revalidate } })
  return readJsonSafely<T>(res, `관리자 API 오류: ${res.status}`)
}

export function fetchAdminStatsFromServer() {
  return fetchJson<{
    scheduleCount: number
    clipCount: number
    streamerCount: number
    pendingFeedbackCount: number
  }>("/admin/stats")
}

export type AdminClipItem = {
  id: string
  title: string
  url: string
  thumbnailUrl: string | null
  createdAt: string | Date
  participants: { streamer: { id: string; name: string; colorCode: string } }[]
}

export async function fetchAdminClipsFromServer() {
  const data = await fetchJson<{ clips: unknown[] }>("/admin/clips", 30)
  return (data.clips as Array<Record<string, unknown>>).map((c) => ({
    id: String(c.id),
    title: String(c.title),
    url: String(c.url),
    thumbnailUrl: c.thumbnailUrl != null ? String(c.thumbnailUrl) : null,
    createdAt: new Date(String(c.createdAt)),
    participants: Array.isArray(c.participants)
      ? (c.participants as Array<Record<string, unknown>>).map((p) => ({
          streamer: {
            id: String((p.streamer as Record<string, unknown> | undefined)?.id ?? ""),
            name: String((p.streamer as Record<string, unknown> | undefined)?.name ?? ""),
            colorCode: String(
              (p.streamer as Record<string, unknown> | undefined)?.colorCode ?? "#673AB7",
            ),
          },
        }))
      : [],
  }))
}

export type AdminScheduleItem = {
  id: string
  title: string
  startTime: string | Date
  isGuerrilla: boolean
  game: { id: string; title: string } | null
  participants: { streamer: { id: string; name: string; colorCode: string } }[]
}

export async function fetchAdminSchedulesFromServer(from?: string, to?: string) {
  const params = new URLSearchParams()
  if (from) params.set("from", from)
  if (to) params.set("to", to)
  const qs = params.toString()
  const data = await fetchJson<{ schedules: unknown[] }>(
    `/admin/schedules${qs ? `?${qs}` : ""}`,
    30,
  )
  return (data.schedules as Array<Record<string, unknown>>).map((s) => ({
    id: String(s.id),
    title: String(s.title),
    startTime: new Date(String(s.startTime)),
    isGuerrilla: Boolean(s.isGuerrilla),
    game:
      s.game && typeof s.game === "object"
        ? {
            id: String((s.game as Record<string, unknown>).id),
            title: String((s.game as Record<string, unknown>).title),
          }
        : null,
    participants: Array.isArray(s.participants)
      ? (s.participants as Array<Record<string, unknown>>).map((p) => ({
          streamer: {
            id: String((p.streamer as Record<string, unknown> | undefined)?.id ?? ""),
            name: String((p.streamer as Record<string, unknown> | undefined)?.name ?? ""),
            colorCode: String(
              (p.streamer as Record<string, unknown> | undefined)?.colorCode ?? "#673AB7",
            ),
          },
        }))
      : [],
  }))
}

export type RecentActivityData = {
  schedules: {
    id: string
    title: string
    startTime: string | Date
    createdAt: string | Date
    game: { title: string } | null
  }[]
  clips: {
    id: string
    title: string
    createdAt: string | Date
    participants: { streamer: { name: string } }[]
  }[]
}

export function fetchRecentActivityFromServer() {
  return fetchJson<RecentActivityData>(
    "/admin/recent-activity",
    60,
  )
}

export type Hoi4LeaderboardData = {
  leaderboard: {
    streamer: { id: string; name: string; colorCode: string }
    total: number
    nations: string[]
  }[]
  sessions: {
    id: string
    title: string
    startTime: string | Date
    game: { title: string } | null
    participants: {
      streamer: { id: string; name: string; colorCode: string }
      nation: string | null
      result?: string | null
    }[]
  }[]
  totalSessions: number
}

export function fetchHoi4LeaderboardFromServer() {
  const base = requireServerBaseUrl()
  return fetchWithBackoff(`${base}/admin/hoi4-leaderboard`, {
    // time-based revalidate만 쓰면 일정 수정 직후에도 stale 응답이 남을 수 있음
    next: { revalidate: 120, tags: ["calendar", "hoi4"] },
  }).then((res) =>
    readJsonSafely<Hoi4LeaderboardData>(res, `관리자 API 오류: ${res.status}`),
  )
}
