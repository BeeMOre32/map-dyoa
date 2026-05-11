import Link from 'next/link';

/**
 * 에러 바운더리·제보 UI 확인용 (로컬 개발 전용).
 * 프로덕션(`NODE_ENV === 'production'`)에서는 절대 throw 하지 않음.
 * 테스트 후 이 라우트 폴더를 삭제해도 됩니다.
 */
export default async function DevThrowPage({
  searchParams,
}: {
  searchParams: Promise<{ go?: string }>;
}) {
  const { go } = await searchParams;

  if (process.env.NODE_ENV === 'development' && go === '1') {
    throw new Error(
      '[테스트] 의도적으로 발생한 오류입니다. 제보 참조·관리자 전송 버튼을 확인한 뒤 이 라우트를 지워 주세요.',
    );
  }

  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-8">
      <h1 className="text-xl font-black text-slate-900 dark:text-white">오류 화면 테스트</h1>
      {isDev ? (
        <>
          <p className="text-sm font-bold leading-relaxed text-slate-600 dark:text-slate-300">
            아래 링크로 들어가면 서버 컴포넌트에서 의도적으로 오류를 던져{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">
              error.tsx
            </code>
            가 뜹니다. 확인 후 이 페이지(`src/app/dev-throw`)를 삭제해도 됩니다.
          </p>
          <Link
            href="/dev-throw?go=1"
            className="inline-flex w-fit items-center justify-center rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-white shadow-md hover:bg-amber-600"
          >
            지금 오류 발생시키기 (?go=1)
          </Link>
        </>
      ) : (
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
          프로덕션에서는 의도적 오류를 내지 않습니다. 로컬에서{' '}
          <code className="font-mono text-xs">npm run dev</code>로 실행한 뒤 이용하세요.
        </p>
      )}
    </div>
  );
}
