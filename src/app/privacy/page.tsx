import { Shield } from 'lucide-react';
import Link from 'next/link';

import { buildPageMetadata } from '@/lib/site';

export const metadata = buildPageMetadata({
  title: '개인정보처리방침',
  description: 'Map-Dyoa 서비스 및 확장 프로그램의 개인정보처리방침입니다.',
  path: '/privacy',
});

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-black text-slate-800 dark:text-white">
        제{number}조 ({title})
      </h2>
      <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="shrink-0 mt-0.5 text-slate-400">•</span>
      <span>{children}</span>
    </li>
  );
}

export default function PrivacyPage() {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="max-w-2xl mx-auto py-6 pb-16 space-y-8">

        {/* 헤더 */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center shadow-sm shrink-0">
            <Shield className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">개인정보처리방침</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              시행일: 2026년 4월 28일 &nbsp;·&nbsp; 최종 수정: 2026년 4월 28일
            </p>
          </div>
        </div>

        {/* 개요 */}
        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
          Map-Dyoa(이하 &ldquo;서비스&rdquo;)는 개인정보보호법 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.
        </div>

        <div className="space-y-8">

          <Section number="1" title="개인정보의 처리 목적">
            <p>서비스는 다음 목적을 위해 개인정보를 처리합니다. 처리된 개인정보는 아래 목적 이외의 용도로 사용되지 않으며, 목적이 변경될 경우 사전 동의를 받겠습니다.</p>
            <ul className="space-y-1 pl-1">
              <Item>관리자 계정 로그인 및 서비스 운영·관리</Item>
              <Item>서비스 이용 현황 파악 및 품질 개선 (익명 통계)</Item>
            </ul>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
              일반 사용자는 별도의 회원가입 없이 서비스를 이용할 수 있으며, 이 경우 개인정보를 수집하지 않습니다.
            </p>
          </Section>

          <Section number="2" title="처리하는 개인정보 항목">
            <p>서비스는 다음의 개인정보 항목을 처리합니다.</p>
            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-3 py-2 text-left font-black text-slate-600 dark:text-slate-300">구분</th>
                    <th className="px-3 py-2 text-left font-black text-slate-600 dark:text-slate-300">항목</th>
                    <th className="px-3 py-2 text-left font-black text-slate-600 dark:text-slate-300">수집 방법</th>
                    <th className="px-3 py-2 text-left font-black text-slate-600 dark:text-slate-300">목적</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">관리자 로그인</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">이메일 주소, 세션 정보</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">로그인 시 입력</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">관리자 인증</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">익명 통계</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">페이지 방문 수, 기기 유형, 성능 지표 (식별 불가 형태)</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">자동 수집</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">서비스 품질 개선</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              ※ 확장 프로그램(Map-Dyoa 멀티뷰 도우미)은 어떠한 개인정보도 수집하지 않습니다.
            </p>
          </Section>

          <Section number="3" title="개인정보의 처리 및 보유 기간">
            <ul className="space-y-1 pl-1">
              <Item>관리자 세션: 브라우저 세션 종료 시 즉시 삭제 (서버 미저장)</Item>
              <Item>익명 통계 데이터: Vercel 정책에 따름 (최대 90일)</Item>
            </ul>
            <p>법령에 따른 별도 보존 의무가 없는 한, 수집 목적 달성 후 즉시 파기합니다.</p>
          </Section>

          <Section number="4" title="개인정보의 제3자 제공">
            <p>서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만 아래의 경우는 예외로 합니다.</p>
            <ul className="space-y-1 pl-1">
              <Item>이용자가 사전에 동의한 경우</Item>
              <Item>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</Item>
            </ul>
          </Section>

          <Section number="5" title="개인정보 처리 위탁">
            <p>서비스는 원활한 서비스 제공을 위해 아래와 같이 개인정보 처리를 위탁합니다.</p>
            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-3 py-2 text-left font-black text-slate-600 dark:text-slate-300">수탁사</th>
                    <th className="px-3 py-2 text-left font-black text-slate-600 dark:text-slate-300">위탁 업무</th>
                    <th className="px-3 py-2 text-left font-black text-slate-600 dark:text-slate-300">보유·이용 기간</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">Vercel Inc.</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">서비스 호스팅, 익명 방문 통계 수집·분석</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">위탁 계약 종료 시까지</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section number="6" title="쿠키(Cookie)의 설치·운영 및 거부">
            <p>서비스는 이용자에게 개별적인 맞춤 서비스를 제공하기 위해 쿠키를 사용합니다.</p>
            <ul className="space-y-1 pl-1">
              <Item><strong className="text-slate-700 dark:text-slate-300">세션 쿠키</strong>: 관리자 로그인 상태 유지 목적. 브라우저 종료 시 삭제.</Item>
              <Item><strong className="text-slate-700 dark:text-slate-300">분석 쿠키</strong>: Vercel Analytics의 익명 통계 수집. 개인 식별 불가.</Item>
            </ul>
            <p>
              브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 일부 서비스 이용이 제한될 수 있습니다.
              설정 경로: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded font-mono text-xs">Chrome → 설정 → 개인 정보 보호 및 보안 → 쿠키</code>
            </p>
          </Section>

          <Section number="7" title="확장 프로그램 개인정보 처리">
            <p>
              &ldquo;Map-Dyoa 멀티뷰 도우미&rdquo; Chrome 확장 프로그램은 단일 목적 프로그램으로,
              치지직(chzzk.naver.com)의 응답 헤더에서 <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded font-mono text-xs">X-Frame-Options</code>를
              제거하여 map-dyoa.site에서 방송을 iframe으로 시청할 수 있도록 합니다.
            </p>
            <ul className="space-y-1 pl-1">
              <Item>어떠한 개인정보도 수집·저장·전송하지 않습니다.</Item>
              <Item>원격 코드를 실행하지 않으며, 모든 동작은 로컬 규칙 파일로 처리됩니다.</Item>
              <Item>사용자의 브라우징 기록, 입력값, 쿠키에 접근하지 않습니다.</Item>
              <Item>치지직 도메인에 대한 응답 헤더 수정에만 권한이 사용됩니다.</Item>
            </ul>
          </Section>

          <Section number="8" title="정보주체의 권리·의무 및 행사 방법">
            <p>이용자는 개인정보보호법에 따라 아래 권리를 행사할 수 있습니다.</p>
            <ul className="space-y-1 pl-1">
              <Item>개인정보 처리 현황 열람 요구</Item>
              <Item>오류 등이 있을 경우 정정 요구</Item>
              <Item>삭제 요구</Item>
              <Item>처리 정지 요구</Item>
            </ul>
            <p>
              권리 행사는 아래 개인정보 보호책임자에게 이메일로 요청하실 수 있으며,
              접수 후 10일 이내에 조치 및 결과를 회신합니다.
            </p>
          </Section>

          <Section number="9" title="개인정보의 안전성 확보 조치">
            <p>서비스는 개인정보보호법 제29조에 따라 다음 조치를 취하고 있습니다.</p>
            <ul className="space-y-1 pl-1">
              <Item>개인정보에 대한 접근 권한을 관리자로 최소화하여 관리</Item>
              <Item>HTTPS를 통한 개인정보 암호화 전송</Item>
              <Item>외부 침입 차단을 위한 Vercel 인프라의 보안 시스템 활용</Item>
              <Item>개인정보 처리 직원의 최소화 및 교육 실시</Item>
            </ul>
          </Section>

          <Section number="10" title="개인정보 보호책임자">
            <p>
              서비스는 개인정보 처리에 관한 업무를 총괄하고 개인정보 처리와 관련한 정보주체의 불만 처리 및 피해 구제를 위해 아래와 같이 개인정보 보호책임자를 지정합니다.
            </p>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
              <p><strong className="text-slate-700 dark:text-slate-300">성명</strong>: Map-Dyoa 운영자</p>
              <p><strong className="text-slate-700 dark:text-slate-300">이메일</strong>:{' '}
                <a href="mailto:windowssart01@gmail.com" className="text-indigo-500 hover:underline">
                  windowssart01@gmail.com
                </a>
              </p>
            </div>
            <p>
              개인정보 보호 관련 문의, 불만 처리, 피해 구제 등에 관한 사항을 위 연락처로 문의하시면 신속하게 처리하겠습니다.
            </p>
          </Section>

          <Section number="11" title="권익침해 구제방법">
            <p>
              정보주체는 개인정보침해로 인한 피해 구제, 상담 등을 위해 아래 기관에 문의하실 수 있습니다.
              아래 기관은 서비스와는 별개의 기관으로, 자체 처리 결과에 만족하지 못하시거나 보다 자세한 도움이 필요하시면 문의하시기 바랍니다.
            </p>
            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-3 py-2 text-left font-black text-slate-600 dark:text-slate-300">기관</th>
                    <th className="px-3 py-2 text-left font-black text-slate-600 dark:text-slate-300">연락처</th>
                    <th className="px-3 py-2 text-left font-black text-slate-600 dark:text-slate-300">홈페이지</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">개인정보보호위원회</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">국번없이 182</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                      <a href="https://privacy.go.kr" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">privacy.go.kr</a>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">한국인터넷진흥원 개인정보침해신고센터</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">국번없이 118</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                      <a href="https://privacy.kisa.or.kr" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">privacy.kisa.or.kr</a>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">대검찰청 사이버수사과</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">국번없이 1301</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                      <a href="https://www.spo.go.kr" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">spo.go.kr</a>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">경찰청 사이버수사국</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">국번없이 182</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                      <a href="https://ecrm.cyber.go.kr" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">ecrm.cyber.go.kr</a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section number="12" title="개인정보처리방침의 변경">
            <p>
              이 개인정보처리방침은 시행일로부터 적용되며, 법령·서비스 변경 등에 따른 내용 추가·삭제·수정이 있을 경우 시행일 7일 전부터 서비스 내 공지사항을 통해 고지합니다.
            </p>
            <ul className="space-y-1 pl-1">
              <Item>공고일: 2026년 4월 28일</Item>
              <Item>시행일: 2026년 4월 28일</Item>
            </ul>
          </Section>

        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <Link
            href="/"
            className="text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors"
          >
            ← 홈으로 돌아가기
          </Link>
          <span className="text-xs text-slate-300 dark:text-slate-600">
            Map-Dyoa · map-dyoa.site
          </span>
        </div>

      </div>
    </div>
  );
}
