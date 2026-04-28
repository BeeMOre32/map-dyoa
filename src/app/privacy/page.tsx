import { Shield } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: '개인정보처리방침 | Map-Dyoa',
  description: 'Map-Dyoa 서비스 및 확장 프로그램의 개인정보처리방침입니다.',
};

export default function PrivacyPage() {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-8 py-6 pb-16">

        {/* 헤더 */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center shadow-sm shrink-0">
            <Shield className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">개인정보처리방침</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              최종 업데이트: 2026년 4월 28일
            </p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">

          {/* 1 */}
          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-800 dark:text-white">1. 서비스 소개</h2>
            <p>
              Map-Dyoa(<Link href="https://map-dyoa.site" className="text-indigo-500 hover:underline">https://map-dyoa.site</Link>)는
              지도동 스트리머들의 방송 일정을 확인하고 멀티뷰로 시청할 수 있는 팬 커뮤니티 서비스입니다.
              본 방침은 Map-Dyoa 웹사이트 및 &ldquo;Map-Dyoa 멀티뷰 도우미&rdquo; Chrome 확장 프로그램에 적용됩니다.
            </p>
          </section>

          {/* 2 */}
          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-800 dark:text-white">2. 수집하는 정보</h2>
            <p>Map-Dyoa는 일반 사용자로부터 별도의 개인정보를 수집하지 않습니다.</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>회원가입 없이 모든 기능을 이용할 수 있습니다.</li>
              <li>관리자 로그인 시 NextAuth를 통해 세션 쿠키가 생성되며, 이는 서버에 저장되지 않고 브라우저 세션에만 유지됩니다.</li>
              <li>Vercel Analytics 및 Speed Insights를 통해 페이지 방문 수, 성능 지표 등 익명화된 통계 데이터가 수집될 수 있습니다. 해당 데이터는 Vercel의 개인정보처리방침을 따릅니다.</li>
            </ul>
          </section>

          {/* 3 */}
          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-800 dark:text-white">3. 확장 프로그램 개인정보 처리</h2>
            <p>
              &ldquo;Map-Dyoa 멀티뷰 도우미&rdquo; Chrome 확장 프로그램은 <strong className="text-slate-700 dark:text-slate-300">어떠한 개인정보도 수집, 저장, 전송하지 않습니다.</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>확장 프로그램은 오직 치지직(chzzk.naver.com)의 응답 헤더에서 <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs font-mono">X-Frame-Options</code> 및 <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs font-mono">Content-Security-Policy</code> 헤더를 제거하는 역할만 합니다.</li>
              <li>원격 코드를 실행하지 않으며, 모든 동작은 로컬에 저장된 규칙 파일(<code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs font-mono">rules.json</code>)로만 처리됩니다.</li>
              <li>사용자의 브라우징 기록, 입력값, 쿠키 등에 접근하지 않습니다.</li>
            </ul>
          </section>

          {/* 4 */}
          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-800 dark:text-white">4. 제3자 서비스</h2>
            <p>Map-Dyoa는 다음 제3자 서비스를 사용합니다.</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong className="text-slate-700 dark:text-slate-300">치지직 (chzzk.naver.com)</strong> — 멀티뷰 방송 콘텐츠 제공. 치지직 로그인 및 채팅은 치지직의 개인정보처리방침을 따릅니다.</li>
              <li><strong className="text-slate-700 dark:text-slate-300">Vercel</strong> — 호스팅 및 익명 분석. Vercel의 개인정보처리방침을 따릅니다.</li>
            </ul>
          </section>

          {/* 5 */}
          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-800 dark:text-white">5. 정보 보유 및 삭제</h2>
            <p>
              수집된 개인정보가 없으므로 별도의 보유 기간이 적용되지 않습니다.
              Vercel Analytics 데이터의 보유 및 삭제는 Vercel 정책에 따릅니다.
            </p>
          </section>

          {/* 6 */}
          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-800 dark:text-white">6. 방침 변경</h2>
            <p>
              본 개인정보처리방침은 서비스 변경에 따라 업데이트될 수 있으며, 변경 시 본 페이지에 최종 업데이트 일자를 함께 표시합니다.
            </p>
          </section>

          {/* 7 */}
          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-800 dark:text-white">7. 문의</h2>
            <p>
              개인정보 처리에 관한 문의는{' '}
              <a href="mailto:windowssart01@gmail.com" className="text-indigo-500 hover:underline">
                windowssart01@gmail.com
              </a>
              으로 연락해 주세요.
            </p>
          </section>

        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <Link
            href="/"
            className="text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>

      </div>
    </div>
  );
}
