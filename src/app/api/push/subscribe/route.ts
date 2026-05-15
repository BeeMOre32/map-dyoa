import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

type PushSubscriptionInput = {
  endpoint?: string;
  expirationTime?: number | null;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { subscription?: PushSubscriptionInput };
    const subscription = body.subscription;
    const endpoint = subscription?.endpoint;
    const p256dh = subscription?.keys?.p256dh;
    const auth = subscription?.keys?.auth;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        { error: 'Invalid push subscription payload.' },
        { status: 400 },
      );
    }

    await getPrisma().pushSubscription.upsert({
      where: { endpoint },
      create: {
        endpoint,
        p256dh,
        auth,
        expirationTime: subscription?.expirationTime
          ? new Date(subscription.expirationTime)
          : null,
        userAgent: req.headers.get('user-agent'),
      },
      update: {
        p256dh,
        auth,
        expirationTime: subscription?.expirationTime
          ? new Date(subscription.expirationTime)
          : null,
        userAgent: req.headers.get('user-agent'),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Subscription failed' },
      { status: 500 },
    );
  }
}
