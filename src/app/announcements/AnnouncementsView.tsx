'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Heart,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Megaphone,
  Smartphone,
  Bell,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import OpenHashDetails from './OpenHashDetails';

function PwaPostBody() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300 pt-3">
      <p>
        <strong className="text-slate-900 dark:text-white">Map-Dyoa</strong>는{' '}
        <strong className="text-slate-900 dark:text-white">PWA(Progressive Web App)</strong>로
        제공됩니다. 브라우저에서{' '}
        <strong className="text-slate-900 dark:text-white">홈 화면(또는 바탕화면)에 추가</strong>
        하면 주소를 매번 입력하지 않고 앱처럼 바로 열 수 있고, 전체 화면에 가깝게(
        <strong className="text-slate-900 dark:text-white">standalone</strong>) 표시됩니다.
      </p>

      <div className="flex gap-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-2xl p-4">
        <Smartphone className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
        <div className="text-violet-700 dark:text-violet-300 text-sm space-y-2">
          <p className="font-black text-violet-900 dark:text-violet-200">모바일에서 추가하는 법</p>
          <ul className="list-disc pl-4 space-y-1.5">
            <li>
              <strong className="text-violet-900 dark:text-violet-200">iOS (Safari)</strong>: 하단{' '}
              <span className="whitespace-nowrap">공유(□↑) → 홈 화면에 추가</span>
            </li>
            <li>
              <strong className="text-violet-900 dark:text-violet-200">Android (Chrome)</strong>: 메뉴(⋮)
              에서 <strong>앱 설치</strong> 또는 <strong>홈 화면에 추가</strong>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex gap-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-2xl p-4">
        <Bell className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <p className="text-indigo-700 dark:text-indigo-300 text-sm">
          설정의 <strong className="text-indigo-900 dark:text-indigo-200">실험적 기능</strong>에서{' '}
          <strong className="text-indigo-900 dark:text-indigo-200">웹 푸시 놓치기 알림</strong>을 켜면
          방송 시작 전 알림 등을 브라우저로 받을 수 있습니다. PWA로 설치한 뒤에도 동일하게 이용할 수
          있습니다.
        </p>
      </div>

      <p className="text-slate-500 dark:text-slate-400 text-xs">
        서비스 워커가 캐시를 사용해 다시 방문할 때 더 빨리 뜨는 경우가 있습니다. 앱 스토어 설치가
        아니라 브라우저 기반 설치이며, 사이트가 업데이트되면 자동으로 반영됩니다.
      </p>
    </div>
  );
}

function DonationPostBody() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300 pt-3">
      <p>
        안녕하세요!{' '}
        <strong className="text-slate-900 dark:text-white">
          지도동 스케줄 & 멀티뷰 사이트(map-doya.site)
        </strong>
        를 운영하고 있는 BeeMOre입니다.
      </p>
      <p>
        처음엔 제가 보기 편하려고 AI와 함께 취미 삼아 만들었던 작은 사이트가,
        어느새 정말 많은 분들이 매일 찾아주시는 공간이 되었습니다. 여러분의
        피드백 덕분에 사이트가 계속 발전할 수 있었습니다.{' '}
        <strong className="text-slate-900 dark:text-white">
          진심으로 감사드립니다!
        </strong>
      </p>

      <div className="flex gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-amber-700 dark:text-amber-300 text-sm">
          최근 이용자 수가 크게 늘고 멀티뷰 등 기능이 추가되면서,{' '}
          <strong className="text-amber-800 dark:text-amber-200">
            기존 무료 서버 티어의 한계
          </strong>
          에 도달했습니다. 끊김 없는 서비스를 위해 서버 업그레이드가 필요한
          상황에서, 고민 끝에{' '}
          <strong className="text-amber-800 dark:text-amber-200">
            자율 후원 시스템
          </strong>
          을 열게 되었습니다.
        </p>
      </div>

      <div>
        <p className="font-black text-slate-900 dark:text-white mb-3">
          후원금에 관한 두 가지 약속
        </p>
        <div className="space-y-3">
          <div className="flex gap-3 bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 shrink-0 mt-0.5">
              <span className="text-indigo-600 dark:text-indigo-400 text-xs font-black">
                1
              </span>
            </div>
            <p className="text-slate-700 dark:text-slate-200">
              후원금은 <strong>서버비(약 $20/월)로만 사용</strong>되며, 남은
              금액은 전액 <strong>푸르메재단에 「지도동」 이름으로 기부</strong>
              됩니다.
            </p>
          </div>
          <div className="flex gap-3 bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 shrink-0 mt-0.5">
              <BarChart3 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-slate-700 dark:text-slate-200">
              매월 초{' '}
              <strong>후원 총액 · 서버 지출 영수증 · 기부 영수증</strong>을 1원
              단위까지 투명하게 공개합니다. (사이트 공지 및 카페)
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4">
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <p className="text-emerald-700 dark:text-emerald-300 text-sm">
          본 후원 진행 방식은 사전에{' '}
          <strong className="text-emerald-800 dark:text-emerald-200">
            위구리님께 기획 의도를 설명드리고 정식으로 허락
          </strong>
          을 구했습니다. 감사하게도 위구리님께서 긍정적으로 검토해 주시고{' '}
          <strong className="text-emerald-800 dark:text-emerald-200">
            공식 홍보까지 약속
          </strong>
          해 주셨습니다!
        </p>
      </div>

      <div className="rounded-2xl border border-pink-100 dark:border-pink-900/50 bg-pink-50 dark:bg-pink-900/10 p-4 space-y-3">
        <p className="font-black text-slate-900 dark:text-white text-sm">
          후원 링크
        </p>
        <a
          href="https://ctee.kr/place/mapdoya"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 bg-linear-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-[0.98] text-white font-black rounded-xl transition-all text-sm shadow-md shadow-pink-500/20"
        >
          <Heart className="w-4 h-4" />
          크티 플레이스에서 후원하기
        </a>
        <p className="text-xs text-pink-500 dark:text-pink-400 text-center">
          서버비를 제외한 남은 금액은 전액 기부됩니다
        </p>
      </div>

      <p className="text-slate-500 dark:text-slate-400">
        후원은 절대 의무가 아닙니다. 사이트의 모든 기능은 앞으로도{' '}
        <strong className="text-slate-700 dark:text-slate-200">
          완전 무료
        </strong>
        로 제공됩니다. 사이트를 즐겨 써주시는 것만으로도 개발자로서 가장 큰
        기쁨이자 원동력입니다. 앞으로도 책임감을 갖고 열심히 유지보수하겠습니다.
        감사합니다 💜
      </p>
    </div>
  );
}

export default function AnnouncementsView() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white dark:bg-slate-950 transition-colors">
      <OpenHashDetails />
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-4 py-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            돌아가기
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                공지사항
              </h1>
              <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">
                글 제목을 눌러 내용을 펼쳐 보세요
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <details
            id="pwa"
            className="group scroll-mt-24 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-sm open:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none dark:open:bg-slate-900"
          >
            <summary className="cursor-pointer list-none px-4 py-4 marker:content-none sm:px-5 [&::-webkit-details-marker]:hidden">
              <span className="flex w-full items-start gap-3 text-left">
                <span className="min-w-0 flex-1 space-y-2">
                  <span className="flex flex-wrap items-center gap-2 gap-y-1">
                    <span
                      className={cn(
                        'inline-block rounded-full px-2.5 py-1 text-xs font-black',
                        'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',
                      )}
                    >
                      기능 안내
                    </span>
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                      2026. 05. 10
                    </span>
                  </span>
                  <span className="block pr-1 text-base font-black leading-snug text-slate-900 dark:text-white sm:text-lg">
                    PWA · 홈 화면에 추가하기
                  </span>
                  <span className="block text-sm font-medium leading-relaxed text-slate-500 group-open:hidden dark:text-slate-400">
                    앱처럼 설치해 빠르게 열고, 웹 푸시 알림과 함께 쓰는 방법을 정리했습니다.
                  </span>
                </span>
                <span className="mt-1 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 dark:text-slate-500">
                  <ChevronDown className="h-5 w-5" aria-hidden />
                </span>
              </span>
            </summary>
            <div className="border-t border-slate-100 px-4 pb-5 pt-1 dark:border-slate-800 sm:px-5">
              <PwaPostBody />
            </div>
          </details>

          <details
            id="donation-2025-05"
            className="group scroll-mt-24 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-sm open:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none dark:open:bg-slate-900"
          >
            <summary className="cursor-pointer list-none px-4 py-4 marker:content-none sm:px-5 [&::-webkit-details-marker]:hidden">
              <span className="flex w-full items-start gap-3 text-left">
                <span className="min-w-0 flex-1 space-y-2">
                  <span className="flex flex-wrap items-center gap-2 gap-y-1">
                    <span
                      className={cn(
                        'inline-block rounded-full px-2.5 py-1 text-xs font-black',
                        'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400',
                      )}
                    >
                      운영 안내
                    </span>
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                      2025. 05. 03
                    </span>
                  </span>
                  <span className="block pr-1 text-base font-black leading-snug text-slate-900 dark:text-white sm:text-lg">
                    서버 업그레이드 및 후원 시스템 안내
                  </span>
                  <span className="block text-sm font-medium leading-relaxed text-slate-500 group-open:hidden dark:text-slate-400">
                    서버 상황, 후원금·기부 약속, 투명 공개 계획을 안내드립니다.
                  </span>
                </span>
                <span className="mt-1 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 dark:text-slate-500">
                  <ChevronDown className="h-5 w-5" aria-hidden />
                </span>
              </span>
            </summary>
            <div className="border-t border-slate-100 px-4 pb-5 pt-1 dark:border-slate-800 sm:px-5">
              <DonationPostBody />
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
