import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { endpoint?: string };
    if (!body.endpoint) {
      return NextResponse.json({ error: 'endpoint is required' }, { status: 400 });
    }

    await getPrisma().pushSubscription.deleteMany({
      where: { endpoint: body.endpoint },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unsubscribe failed' },
      { status: 500 },
    );
  }
}
