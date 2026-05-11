import { NextResponse } from 'next/server';

/**
 * 푸시 리마인더(크론) 기능 비활성화.
 * 호출 시 항상 동일 응답만 반환하며, 스케줄/구독 조회·발송 로직은 포함하지 않음.
 */
export function POST() {
  return NextResponse.json(
    { ok: false, disabled: true, reason: 'push_reminders_disabled' },
    { status: 503 },
  );
}

export function GET() {
  return POST();
}
