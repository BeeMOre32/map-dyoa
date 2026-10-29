import { NextResponse } from 'next/server';
import { fetchWithBackoff } from '@/lib/map-dyoa-server-http-utils';
import { getScheduleServerBaseUrl } from '@/lib/map-dyoa-server-schedules';

const RECEIPT = /^[A-Za-z0-9_-]{43}$/;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ replies: [] });
  }
  const receipts = Array.isArray((body as { receipts?: unknown })?.receipts)
    ? (body as { receipts: unknown[] }).receipts
    : [];
  const items = receipts.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as { id?: unknown; receipt?: unknown };
    if (typeof row.id !== 'string' || typeof row.receipt !== 'string') return [];
    if (row.id.length < 8 || row.id.length > 64 || !RECEIPT.test(row.receipt)) return [];
    return [{ id: row.id, receipt: row.receipt }];
  }).slice(0, 20);

  if (items.length === 0) return NextResponse.json({ replies: [] });

  const base = getScheduleServerBaseUrl();
  if (!base) return NextResponse.json({ replies: [] });

  try {
    const res = await fetchWithBackoff(`${base}/feedbacks/receipts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receipts: items }),
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ replies: [] });
    const data = (await res.json()) as { replies?: unknown };
    const replies = Array.isArray(data.replies)
      ? data.replies.flatMap((item) => {
          if (!item || typeof item !== 'object') return [];
          const row = item as { id?: unknown; reply?: unknown };
          if (typeof row.id !== 'string' || typeof row.reply !== 'string' || !row.reply.trim()) {
            return [];
          }
          return [{ id: row.id, reply: row.reply.trim().slice(0, 500) }];
        })
      : [];
    return NextResponse.json({ replies });
  } catch {
    return NextResponse.json({ replies: [] });
  }
}
