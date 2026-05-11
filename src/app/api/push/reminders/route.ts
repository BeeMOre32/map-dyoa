import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPushNotification } from '@/lib/web-push';

function hasCronAuth(req: NextRequest) {
  const secret = process.env.REMINDER_CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';
  const bearer = req.headers.get('authorization');
  return bearer === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ ok: false, disabled: true }, { status: 503 });

  if (!hasCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);

  const [schedules, subscriptions] = await Promise.all([
    prisma.schedule.findMany({
      where: {
        isLiveEnded: false,
        startTime: {
          gt: now,
          lte: tenMinutesLater,
        },
      },
      select: {
        id: true,
        title: true,
        startTime: true,
      },
    }),
    prisma.pushSubscription.findMany({
      select: {
        id: true,
        endpoint: true,
        p256dh: true,
        auth: true,
        expirationTime: true,
      },
    }),
  ]);

  let sent = 0;
  let removed = 0;

  for (const schedule of schedules) {
    const startText = schedule.startTime.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    for (const sub of subscriptions) {
      try {
        await prisma.pushReminderLog.create({
          data: {
            subscriptionId: sub.id,
            scheduleId: schedule.id,
            scheduledFor: schedule.startTime,
          },
        });
      } catch {
        // already sent to this subscription for this schedule
        continue;
      }

      try {
        await sendPushNotification(sub, {
          title: '놓치기 알림',
          body: `${schedule.title} · ${startText} 시작`,
          url: `/calendar/schedule/${schedule.id}`,
        });
        sent += 1;
      } catch (error: unknown) {
        const statusCode =
          typeof error === 'object' &&
          error !== null &&
          'statusCode' in error &&
          typeof (error as { statusCode?: unknown }).statusCode === 'number'
            ? (error as { statusCode: number }).statusCode
            : null;

        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
          removed += 1;
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    schedules: schedules.length,
    subscriptions: subscriptions.length,
    sent,
    removed,
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
