import { NextResponse } from 'next/server';
import { revalidatePath, updateTag } from 'next/cache';
import { feedbackSchema } from '@/lib/schemas';
import { submitFeedbackCore } from '@/lib/feedback-submit';
import { getRevalidationPaths } from '@/constants/revalidation-paths';

type Body = {
  category?: unknown;
  content?: unknown;
  streamerId?: unknown;
  streamerName?: unknown;
  type?: unknown;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'JSON이 필요합니다.' }, { status: 400 });
  }

  const parsed = feedbackSchema.safeParse({
    category: body.category,
    content: body.content,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  const type =
    body.type === 'ERROR_REPORT' ? ('ERROR_REPORT' as const) : ('EDIT_REQUEST' as const);

  const result = await submitFeedbackCore({
    category: parsed.data.category,
    content: parsed.data.content,
    streamerId: typeof body.streamerId === 'string' ? body.streamerId : undefined,
    streamerName: typeof body.streamerName === 'string' ? body.streamerName : undefined,
    type,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  try {
    const paths = getRevalidationPaths('admin');
    await Promise.all(paths.map((path: string) => revalidatePath(path)));
    updateTag('admin');
  } catch {
    /* 캐시 무효화 실패해도 저장은 완료됨 */
  }

  return NextResponse.json({ ok: true as const });
}
