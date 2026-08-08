'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
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
  Server,
  Sparkles,
  LayoutGrid,
  Radio,
  Activity,
  Puzzle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CHROME_EXTENSION_NAME,
  CHROME_EXTENSION_URL,
} from '@/constants/extension';
import OpenHashDetails from './OpenHashDetails';

function LoadingSpeedComparison() {
  return (
    <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800/50 bg-linear-to-br from-indigo-50 via-violet-50 to-white dark:from-indigo-900/25 dark:via-violet-900/20 dark:to-slate-900 p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-slate-900 dark:text-white">
          로딩 속도 체감 비교
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-900/40 px-2.5 py-1 text-[11px] font-black text-emerald-700 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          빠른 시작
        </span>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span>기존 웹 진입</span>
            <span>~3.4s</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-200/70 dark:bg-slate-800 overflow-hidden">
            <div className="h-full w-[32%] bg-slate-400/70 dark:bg-slate-500/70" />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
            <span>PWA 홈 화면 실행</span>
            <span>~1.1s</span>
          </div>
          <div className="relative h-2.5 rounded-full bg-indigo-100/80 dark:bg-indigo-900/40 overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-[82%] bg-linear-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
            <div
              className="absolute inset-y-0 left-0 w-8 bg-white/50 dark:bg-white/20 blur-[1px] animate-[pulse_1.4s_ease-in-out_infinite]"
              style={{ transform: 'translateX(420%)' }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-1">
        {['앱 셸 캐시', '정적 자원 선로딩', '재방문 가속'].map((item, i) => (
          <div
            key={item}
            className="rounded-xl border border-white/70 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 px-2 py-2 text-center text-[10px] font-black text-slate-600 dark:text-slate-300 animate-pulse"
            style={{
              animationDelay: `${i * 120}ms`,
              animationDuration: '1.8s',
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function ServerLoadingExperience({ active }: { active: boolean }) {
  const [legacyMs, setLegacyMs] = useState(0);
  const [optimizedMs, setOptimizedMs] = useState(0);
  const [legacyWidth, setLegacyWidth] = useState(0);
  const [optimizedWidth, setOptimizedWidth] = useState(0);

  useEffect(() => {
    let frameId = 0;
    let secondFrameId = 0;
    let secondStartTimer: ReturnType<typeof setTimeout> | null = null;

    if (!active) {
      setLegacyMs(0);
      setOptimizedMs(0);
      setLegacyWidth(0);
      setOptimizedWidth(0);
      return;
    }

    const animateFirst = (startTime: number) => {
      const duration = 1100;
      const tick = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        setLegacyWidth(36 * progress);
        setLegacyMs(Math.round(380 * progress));
        if (progress < 1) frameId = requestAnimationFrame(tick);
      };
      frameId = requestAnimationFrame(tick);
    };

    const animateSecond = () => {
      const startTime = performance.now();
      const duration = 1300;
      const tick = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        setOptimizedWidth(88 * progress);
        setOptimizedMs(Math.round(120 * progress));
        if (progress < 1) secondFrameId = requestAnimationFrame(tick);
      };
      secondFrameId = requestAnimationFrame(tick);
    };

    const secondStart = performance.now();
    animateSecond();
    secondStartTimer = setTimeout(() => animateFirst(secondStart), 420);

    return () => {
      cancelAnimationFrame(frameId);
      cancelAnimationFrame(secondFrameId);
      if (secondStartTimer) clearTimeout(secondStartTimer);
    };
  }, [active]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-sky-200 dark:border-sky-800/50 bg-linear-to-br from-sky-50 via-cyan-50 to-white dark:from-sky-900/25 dark:via-cyan-900/20 dark:to-slate-900 p-4 space-y-4">
      <div className="pointer-events-none absolute -left-24 top-0 h-full w-24 bg-linear-to-r from-transparent via-white/30 to-transparent dark:via-white/10 animate-[pulse_2.4s_ease-in-out_infinite]" />

      <div className="relative z-10 flex items-center justify-between">
        <p className="text-sm font-black text-slate-900 dark:text-white">
          서버 로딩 속도 체감
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100/80 dark:bg-sky-900/40 px-2.5 py-1 text-[11px] font-black text-sky-700 dark:text-sky-300">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-ping" />
          튜닝 시뮬레이션
        </span>
      </div>

      <div className="relative z-10 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-sky-700 dark:text-sky-300">
            <span>분리 백엔드 목표 체감</span>
            <span>{optimizedMs}ms</span>
          </div>
          <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-sky-500 via-cyan-500 to-indigo-500 transition-[width] duration-300"
              style={{ width: `${optimizedWidth}%` }}
            />
            <div className="absolute inset-y-0 left-0 w-12 translate-x-[780%] bg-white/60 blur-[1px] animate-[pulse_1s_ease-in-out_infinite] dark:bg-white/20" />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span>기존 API 응답 체감</span>
            <span>{legacyMs}ms</span>
          </div>
          <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-slate-400/70 transition-[width] duration-300 dark:bg-slate-500/70"
              style={{ width: `${legacyWidth}%` }}
            />
            <div className="absolute inset-y-0 left-0 w-12 translate-x-[120%] bg-white/60 blur-[1px] animate-[pulse_1.2s_ease-in-out_infinite] dark:bg-white/20" />
          </div>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-3 gap-2 pt-1">
        {['워커 분리', '커넥션 튜닝', '쿼리 최적화'].map((item, i) => (
          <div
            key={item}
            className="rounded-xl border border-white/80 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 px-2 py-2 text-center text-[10px] font-black text-slate-600 dark:text-slate-300 animate-[pulse_1.8s_ease-in-out_infinite]"
            style={{ animationDelay: `${i * 140}ms` }}
          >
            {item}
          </div>
        ))}
      </div>

      <p className="relative z-10 text-[11px] font-bold text-sky-700/90 dark:text-sky-300/90">
        체감 기준 약 68% 응답 시간 단축 목표
      </p>
    </div>
  );
}

function PwaPostBody() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300 pt-3">
      <p>
        <strong className="text-slate-900 dark:text-white">Map-Dyoa</strong>는{' '}
        <strong className="text-slate-900 dark:text-white">
          PWA(Progressive Web App)
        </strong>
        로 제공됩니다. 브라우저에서{' '}
        <strong className="text-slate-900 dark:text-white">
          홈 화면(또는 바탕화면)에 추가
        </strong>
        하면 주소를 매번 입력하지 않고 앱처럼 바로 열 수 있고, 전체 화면에
        가깝게(
        <strong className="text-slate-900 dark:text-white">standalone</strong>)
        표시됩니다.
      </p>

      <div className="flex gap-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-2xl p-4">
        <Smartphone className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
        <div className="text-violet-700 dark:text-violet-300 text-sm space-y-2">
          <p className="font-black text-violet-900 dark:text-violet-200">
            모바일에서 추가하는 법
          </p>
          <ul className="list-disc pl-4 space-y-1.5">
            <li>
              <strong className="text-violet-900 dark:text-violet-200">
                iOS (Safari)
              </strong>
              : 하단{' '}
              <span className="whitespace-nowrap">
                공유(□↑) → 홈 화면에 추가
              </span>
            </li>
            <li>
              <strong className="text-violet-900 dark:text-violet-200">
                Android (Chrome)
              </strong>
              : 메뉴(⋮) 에서 <strong>앱 설치</strong> 또는{' '}
              <strong>홈 화면에 추가</strong>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex gap-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-2xl p-4">
        <Bell className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <p className="text-indigo-700 dark:text-indigo-300 text-sm">
          설정의{' '}
          <strong className="text-indigo-900 dark:text-indigo-200">
            실험적 기능
          </strong>
          에서{' '}
          <strong className="text-indigo-900 dark:text-indigo-200">
            웹 푸시 놓치기 알림
          </strong>
          을 켜면 방송 시작 전 알림 등을 브라우저로 받을 수 있습니다. PWA로
          설치한 뒤에도 동일하게 이용할 수 있습니다.
        </p>
      </div>

      <p className="text-slate-500 dark:text-slate-400 text-xs">
        서비스 워커가 캐시를 사용해 다시 방문할 때 더 빨리 뜨는 경우가 있습니다.
        앱 스토어 설치가 아니라 브라우저 기반 설치이며, 사이트가 업데이트되면
        자동으로 반영됩니다.
      </p>

      <LoadingSpeedComparison />
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

function ApiUiUpdatePostBody() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300 pt-3">
      <p>
        이번 업데이트에서는{' '}
        <strong className="text-slate-900 dark:text-white">
          map-dyoa-server(Fly API)
        </strong>
        로의 데이터 연동을 마무리하고, 지금까지 베타로 테스트하던{' '}
        <strong className="text-slate-900 dark:text-white">
          새 캘린더·일정 UI
        </strong>
        를 전 사용자에게 기본 적용했습니다. 아래에 API·화면·기타 변경 사항을
        정리했습니다.
      </p>

      <div className="flex gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4">
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <div className="text-emerald-700 dark:text-emerald-300 text-sm space-y-2">
          <p className="font-black text-emerald-900 dark:text-emerald-200">
            API · 백엔드 연동 (완료)
          </p>
          <ul className="list-disc pl-4 space-y-1.5">
            <li>
              <code className="text-[12px] font-mono">MAP_DYOA_SERVER_URL</code>{' '}
              설정 시 일정·스트리머·클립·게임 조회를 Fly API로 처리 (Next.js DB
              직접 연결 최소화)
            </li>
            <li>
              일정 생성·수정·삭제, 클립·스트리머·게임 관리 등 쓰기 작업 서버 API
              연동
            </li>
            <li>
              캘린더·스트리머 상세·클립 목록·HOI4 전적·관리자 통계·피드백 등
              읽기 API 일괄 전환
            </li>
            <li>치지직 라이브 상태 조회 API 연동 (캘린더 LIVE 뱃지·멤버 탭)</li>
            <li>
              <Link
                href="/health"
                className="font-black underline underline-offset-2"
              >
                백엔드 상태
              </Link>
              — 큰 줄기 실시간 응답·30분 Cron·14일 기능별 히트맵·공지 7일 가동률 뱃지
            </li>
          </ul>
        </div>
      </div>

      <div className="flex gap-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-2xl p-4">
        <LayoutGrid className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <div className="text-indigo-700 dark:text-indigo-300 text-sm space-y-2">
          <p className="font-black text-indigo-900 dark:text-indigo-200">
            새 UI (기본 적용)
          </p>
          <ul className="list-disc pl-4 space-y-1.5">
            <li>
              <strong className="text-indigo-900 dark:text-indigo-200">
                V2 캘린더 카드
              </strong>{' '}
              — 주간 카드형 컬럼, 게임 색 반영, 모바일·월간 가독성 개선
            </li>
            <li>
              <strong className="text-indigo-900 dark:text-indigo-200">
                V2 일정 상세 모달
              </strong>{' '}
              — 클립·HOI4 전적 사이드 패널, 데스크탑·모바일 레이아웃 정리
            </li>
            <li>주·월 이동 시 그리드 슬라이드·카드 스프링 애니메이션</li>
            <li>
              설정의 「실험적 기능」 토글 제거 — 새 UI가 기본, 필요 시 아래
              구버전 옵션 사용
            </li>
            <li>
              설정 → 캘린더 →{' '}
              <strong className="text-indigo-900 dark:text-indigo-200">
                구버전 UI로 보기
              </strong>
              로 이전 캘린더·모달 복원 가능
            </li>
          </ul>
        </div>
      </div>

      <div className="flex gap-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-2xl p-4">
        <Sparkles className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
        <div className="text-violet-700 dark:text-violet-300 text-sm space-y-2">
          <p className="font-black text-violet-900 dark:text-violet-200">
            기타 개선
          </p>
          <ul className="list-disc pl-4 space-y-1.5">
            <li>
              <strong className="text-violet-900 dark:text-violet-200">
                HOI4 내전
              </strong>{' '}
              — 게스트도 플레이 국가 등록 가능, 승·패 기록 UI·저장 제거 (국가만
              집계)
            </li>
            <li>
              <Link
                href="/hoi4"
                className="font-black underline underline-offset-2"
              >
                HOI4 참전 기록
              </Link>
              탭은 설정과 무관하게 항상 표시
            </li>
            <li>
              <strong className="text-violet-900 dark:text-violet-200">
                LIVE 표시
              </strong>{' '}
              — 등록된 시작 시각 이전에는 LIVE 뱃지·치지직 라이브 링크·일정
              멀티뷰 버튼 숨김 (시간 미정 일정 제외)
            </li>
            <li>일정·클립 저장 후 캘린더 자동 갱신, 모달 로딩 스켈레톤 개선</li>
            <li>설정 모달 한글 표시 오류 수정</li>
          </ul>
        </div>
      </div>

      <div className="flex gap-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
        <Radio className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          문제가 있거나 이전 화면이 더 편하시면{' '}
          <strong className="text-slate-800 dark:text-slate-200">
            설정 → 구버전 UI로 보기
          </strong>
          를 켜 주세요. API·UI 관련 제보는 사이트 내 피드백이나 이메일로
          보내주시면 반영에 참고하겠습니다.
        </p>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        <Link
          href="/calendar"
          className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          캘린더
        </Link>
        에서 새 UI를 바로 확인할 수 있습니다.
      </p>
    </div>
  );
}

function BackendProjectPostBody({ active }: { active: boolean }) {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300 pt-3">
      <p>
        서버 성능 개선을 위해 기존 앱과 분리된{' '}
        <strong className="text-slate-900 dark:text-white">
          신규 백엔드 프로젝트
        </strong>
        를 구성했습니다. 목표는 응답 속도 안정화와 동시 연결 처리량 개선입니다.
      </p>

      <div className="flex gap-3 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/50 rounded-2xl p-4">
        <Server className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
        <div className="text-sky-700 dark:text-sky-300 text-sm space-y-2">
          <p className="font-black text-sky-900 dark:text-sky-200">
            이번 작업에서 완료한 항목
          </p>
          <ul className="list-disc pl-4 space-y-1.5">
            <li>Bun + Elysia 기반 API 서버 초기 구조 구성</li>
            <li>Drizzle + postgres.js DB 연결 계층 구성</li>
            <li>헬스 체크 엔드포인트(`/health`) 추가</li>
            <li>독립 실행/타입체크/DB 스크립트 구성</li>
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 p-4">
        <p className="text-emerald-700 dark:text-emerald-300 text-sm">
          백엔드 모니터링은{' '}
          <Link
            href="/health"
            className="font-black underline underline-offset-2"
          >
            백엔드 상태 페이지
          </Link>
          에서 실시간·히트맵·Cron 기록을 확인할 수 있습니다. 자세한 6월 업데이트는{' '}
          <Link
            href="#update-2026-06"
            className="font-black underline underline-offset-2"
          >
            6월 기능 업데이트
          </Link>
          공지를 참고해 주세요.
        </p>
      </div>

      <ServerLoadingExperience active={active} />
    </div>
  );
}

function UpdateAugust2026PostBody() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300 pt-3">
      <p>
        8월 업데이트로{' '}
        <strong className="text-slate-900 dark:text-white">LIVE 미리보기</strong>,{' '}
        <strong className="text-slate-900 dark:text-white">일정 상세 LIVE</strong>,{' '}
        <strong className="text-slate-900 dark:text-white">클립 호버 재생</strong>을
        추가했습니다. 치지직 iframe 재생에는{' '}
        <a
          href={CHROME_EXTENSION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-black text-indigo-600 underline underline-offset-2 dark:text-indigo-400"
        >
          {CHROME_EXTENSION_NAME}
        </a>{' '}
        <strong className="text-slate-900 dark:text-white">1.3.0</strong>이 필요합니다.
      </p>

      <div className="flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-800/50 dark:bg-rose-900/20">
        <Radio className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
        <div className="space-y-2 text-sm text-rose-700 dark:text-rose-300">
          <p className="font-black text-rose-900 dark:text-rose-200">
            스트리머 LIVE 호버 미리보기
          </p>
          <ul className="list-disc space-y-1.5 pl-4">
            <li>
              <Link href="/streamers" className="font-black underline underline-offset-2">
                스트리머
              </Link>
              목록에서 LIVE 카드에 마우스를 올리면 미리보기 창이 열립니다
            </li>
            <li>
              기본은 음소거 ·{' '}
              <strong className="text-rose-900 dark:text-rose-200">「소리 켜기」</strong>
              를 누른 뒤 <strong className="text-rose-900 dark:text-rose-200">화면을 한 번 클릭</strong>
              하면 작은 소리로 재생됩니다 (브라우저 정책)
            </li>
            <li>「소리 켜짐」을 누르면 다시 음소거됩니다</li>
            <li>핀·드래그로 미리보기 위치를 고정하거나 옮길 수 있습니다</li>
          </ul>
        </div>
      </div>

      <div className="flex gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800/50 dark:bg-indigo-900/20">
        <LayoutGrid className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
        <div className="space-y-2 text-sm text-indigo-700 dark:text-indigo-300">
          <p className="font-black text-indigo-900 dark:text-indigo-200">
            일정 상세 LIVE 탭
          </p>
          <ul className="list-disc space-y-1.5 pl-4">
            <li>일정 상세 사이드 패널에서 LIVE 탭으로 참가 스트리머 방송을 볼 수 있습니다</li>
            <li>합동 방송은 칩으로 스트리머를 바꿔 가며 시청 (한 번에 하나)</li>
            <li>모바일은 LIVE 버튼 → 하단 시트로 재생합니다</li>
            <li>호버 미리보기와 상세 LIVE는 같은 방송이면 중복 iframe을 만들지 않습니다</li>
          </ul>
        </div>
      </div>

      <div className="flex gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-800/50 dark:bg-violet-900/20">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
        <div className="space-y-2 text-sm text-violet-700 dark:text-violet-300">
          <p className="font-black text-violet-900 dark:text-violet-200">
            클립 호버 미리보기
          </p>
          <ul className="list-disc space-y-1.5 pl-4">
            <li>
              <Link href="/clips" className="font-black underline underline-offset-2">
                클립
              </Link>
              카드에 약 1초 올려두면 미리보기가 로드·재생됩니다 (데스크톱)
            </li>
            <li>
              기본 음소거 ·{' '}
              <strong className="text-violet-900 dark:text-violet-200">「소리 켜기」</strong>
              후 화면을 한 번 클릭하면 작은 소리로 들립니다
            </li>
            <li>카드 클릭 시 전체 화면 플레이어로 이어집니다</li>
            <li>동시에 하나의 클립만 미리보기됩니다</li>
          </ul>
        </div>
      </div>

      <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-900/20">
        <Puzzle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <div className="space-y-2 text-sm text-amber-800 dark:text-amber-300">
          <p className="font-black text-amber-900 dark:text-amber-200">
            Chrome 확장 {CHROME_EXTENSION_NAME} · 1.3.0
          </p>
          <ul className="list-disc space-y-1.5 pl-4">
            <li>LIVE·클립 미리보기 재생 · 소리 켜기(화면 클릭) 지원</li>
            <li>미리보기 소리는 항상 작은 음량으로만 재생</li>
            <li>클립 미리보기에서 검은 화면·재생 버튼 이슈 완화</li>
            <li>
              <a
                href={CHROME_EXTENSION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-black underline underline-offset-2"
              >
                Chrome 웹 스토어
              </a>
              에서 설치·업데이트해 주세요
            </li>
          </ul>
        </div>
      </div>

      <p className="text-slate-500 dark:text-slate-400">
        확장이 없으면 미리보기 대신 치지직으로 이어지는 안내가 표시됩니다. 멀티뷰·일정
        멀티뷰도 같은 확장을 사용합니다.
      </p>
    </div>
  );
}

function UpdateJune2026PostBody() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300 pt-3">
      <p>
        6월 중순 업데이트로 <strong className="text-slate-900 dark:text-white">백엔드 가동
        모니터링</strong>, <strong className="text-slate-900 dark:text-white">멀티뷰 UX</strong>,
        설정·도움말 정리를 반영했습니다.
      </p>

      <div className="flex gap-3 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/50 rounded-2xl p-4">
        <Activity className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
        <div className="text-sky-700 dark:text-sky-300 text-sm space-y-2">
          <p className="font-black text-sky-900 dark:text-sky-200">백엔드 상태 모니터링</p>
          <ul className="list-disc pl-4 space-y-1.5">
            <li>
              <Link href="/health" className="font-black underline underline-offset-2">
                백엔드 상태 페이지
              </Link>
              — 실시간 API 응답·지연·본문 확인
            </li>
            <li>Vercel Cron 30분 간격 큰 줄기(서버·DB·일정·멤버·클립) 헬스 체크·14일 보관</li>
            <li>마지막 Cron 실행·수집 시작 시각·누적 샘플 수 표시</li>
            <li>기능별 14일 KST 히트맵 (행=기능 · 열=날짜 · 정상·저하·장애)</li>
            <li>공지 상단 최근 7일 가동률 뱃지 → 상태 페이지 링크</li>
            <li>관리자 대시보드 — 연속 실패 시 장애 공지 초안 바로 작성</li>
          </ul>
        </div>
      </div>

      <div className="flex gap-3 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800/50 rounded-2xl p-4">
        <LayoutGrid className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
        <div className="text-cyan-700 dark:text-cyan-300 text-sm space-y-2">
          <p className="font-black text-cyan-900 dark:text-cyan-200">멀티뷰 개선</p>
          <ul className="list-disc pl-4 space-y-1.5">
            <li>선택 화면 LIVE 뱃지·<strong>LIVE만 선택</strong>·세션 상태 localStorage 복원</li>
            <li>레이아웃 프리셋(자동·균등·1행), 패널 드래그 순서·크기 저장</li>
            <li>컨트롤 고정(P), 음소거·솔로 오디오, 내장/사이드 채팅 구분</li>
            <li>단축키 1~9 포커스 · P 고정 · Esc 닫기 · 첫 방문 버튼 안내 모달</li>
            <li>Chrome 확장 v1.2.7 — 채팅 접기·음소거·embed 스타일 개선</li>
          </ul>
        </div>
      </div>

      <div className="flex gap-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-2xl p-4">
        <Puzzle className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
        <div className="text-violet-700 dark:text-violet-300 text-sm space-y-2">
          <p className="font-black text-violet-900 dark:text-violet-200">설정·도움말</p>
          <ul className="list-disc pl-4 space-y-1.5">
            <li>설정 → <strong>백엔드 상태</strong>, <strong>멀티뷰 확장 프로그램</strong> 링크</li>
            <li>
              도움말{' '}
              <Link href="/help#backend-health" className="font-black underline underline-offset-2">
                백엔드 상태
              </Link>
              ·{' '}
              <Link href="/help#multiview" className="font-black underline underline-offset-2">
                멀티뷰
              </Link>{' '}
              섹션 최신화
            </li>
            <li>
              <a
                href={CHROME_EXTENSION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-black underline underline-offset-2"
              >
                {CHROME_EXTENSION_NAME}
              </a>{' '}
              Chrome 웹스토어에서 설치
            </li>
          </ul>
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        <Link href="/help" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
          도움말
        </Link>
        과{' '}
        <Link href="/health" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
          백엔드 상태
        </Link>
        에서 자세히 안내합니다.
      </p>
    </div>
  );
}

function SettlementJuly2026PostBody() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300 pt-3">
      <p>
        앞서 약속드린 대로,{' '}
        <strong className="text-slate-900 dark:text-white">
          후원 수익금 · 서버비 납부 · 잔여금 처리
        </strong>
        를 투명하게 공개하기 위해 글을 남깁니다.
      </p>

      <div className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800/50 dark:bg-emerald-900/20">
        <Heart className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
        <p className="text-sm text-emerald-700 dark:text-emerald-300">
          지난달(7월) 후원 수익금은 총{' '}
          <strong className="text-emerald-800 dark:text-emerald-200">
            15,000원
          </strong>
          입니다. 후원해 주신 분들께 진심으로 감사드립니다.
        </p>
      </div>

      <div className="space-y-3 rounded-2xl border border-teal-200 bg-teal-50/70 p-4 dark:border-teal-800/50 dark:bg-teal-900/15">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <p className="text-sm font-black text-slate-900 dark:text-white">
            7월 정산 내역
          </p>
        </div>
        <div className="divide-y divide-teal-100 overflow-hidden rounded-xl border border-teal-100 bg-white/70 dark:divide-teal-900/40 dark:border-teal-900/40 dark:bg-slate-800/50">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="font-bold text-slate-600 dark:text-slate-300">
              6월 이월 잔여금
            </span>
            <span className="font-black text-slate-700 dark:text-slate-200">
              97,720원
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="font-bold text-slate-600 dark:text-slate-300">
              7월 후원 수익금
            </span>
            <span className="font-black text-emerald-600 dark:text-emerald-400">
              + 15,000원
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="font-bold text-slate-600 dark:text-slate-300">
              서버비{' '}
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                (tax 포함 $22 · 7/2 환율)
              </span>
            </span>
            <span className="font-black text-rose-500 dark:text-rose-400">
              − 35,601원
            </span>
          </div>
          <div className="flex items-center justify-between bg-teal-50/70 px-4 py-3 dark:bg-teal-900/20">
            <span className="font-black text-slate-800 dark:text-slate-100">
              잔여금 (이월)
            </span>
            <span className="font-black text-slate-900 dark:text-white">
              77,119원
            </span>
          </div>
        </div>
        <p className="text-xs font-medium text-teal-700/80 dark:text-teal-300/80">
          계산: 97,720 + 15,000 − 35,601 = 77,119원
        </p>
      </div>

      <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-900/20">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <div className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
          <p>
            지난달과 같이 잔여금{' '}
            <strong className="text-amber-800 dark:text-amber-200">
              77,119원은 다음 달로 이월
            </strong>
            합니다.
          </p>
          <p>
            기능 업데이트는 꾸준히 이어가고 있고, 이번 주~다음 주에는 실험 중인
            기능을 안정화하는 작업을 할 예정입니다. 자세한 패치 노트는 담주에
            한꺼번에 정리해 올릴 예정입니다.
          </p>
          <p>
            제가 만든 서비스다 보니 문제를 스스로 잘 못 느끼는 경우가 있습니다.
            불편하거나 개선이 필요한 점이 있으면{' '}
            <strong className="text-amber-800 dark:text-amber-200">
              카페 댓글
            </strong>
            이나{' '}
            <a
              href="mailto:windowssart01@gmail.com"
              className="font-black underline underline-offset-2"
            >
              이메일
            </a>
            로 편하게 피드백 남겨 주세요.
          </p>
        </div>
      </div>

      <a
        href="https://naver.me/Gahqc9RY"
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-teal-500 to-emerald-500 py-3 text-sm font-black text-white shadow-md shadow-teal-500/20 transition-all hover:from-teal-600 hover:to-emerald-600 active:scale-[0.98]"
      >
        <Megaphone className="h-4 w-4" />
        자세한 내역은 카페 글에서 확인하기
      </a>

      <p className="text-slate-500 dark:text-slate-400">
        늘 사이트를 아껴 주시고 후원해 주셔서 진심으로 감사합니다 💜
      </p>
    </div>
  );
}

function SettlementJune2026PostBody() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300 pt-3">
      <p>
        앞서 약속드린 대로,{' '}
        <strong className="text-slate-900 dark:text-white">
          후원 수익금 · 서버비 납부 · 잔여금 처리
        </strong>
        를 투명하게 공개하기 위해 글을 남깁니다.
      </p>

      <div className="flex gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4">
        <Heart className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <p className="text-emerald-700 dark:text-emerald-300 text-sm">
          지난달 후원 수익금은 총{' '}
          <strong className="text-emerald-800 dark:text-emerald-200">
            136,000원
          </strong>
          으로, 생각보다 많은 분들이 후원해 주셨습니다. 관심과 응원에 진심으로
          감사드립니다.
        </p>
      </div>

      <div className="rounded-2xl border border-teal-200 dark:border-teal-800/50 bg-teal-50/70 dark:bg-teal-900/15 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <p className="font-black text-slate-900 dark:text-white text-sm">
            6월 정산 내역
          </p>
        </div>
        <div className="divide-y divide-teal-100 dark:divide-teal-900/40 overflow-hidden rounded-xl border border-teal-100 bg-white/70 dark:border-teal-900/40 dark:bg-slate-800/50">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="font-bold text-slate-600 dark:text-slate-300">
              후원 수익금
            </span>
            <span className="font-black text-emerald-600 dark:text-emerald-400">
              + 136,000원
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="font-bold text-slate-600 dark:text-slate-300">
              서버비{' '}
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                (tax 포함 $24.29 · 6/2 환율)
              </span>
            </span>
            <span className="font-black text-rose-500 dark:text-rose-400">
              − 38,280원
            </span>
          </div>
          <div className="flex items-center justify-between bg-teal-50/70 px-4 py-3 dark:bg-teal-900/20">
            <span className="font-black text-slate-800 dark:text-slate-100">
              잔여금
            </span>
            <span className="font-black text-slate-900 dark:text-white">
              97,720원
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-amber-700 dark:text-amber-300 text-sm space-y-2">
          <p>
            기부 관련 피드백을 받았는데, 후원금이 월마다 일정하지 않다 보니{' '}
            <strong className="text-amber-800 dark:text-amber-200">
              잔여금은 다음 달로 이월
            </strong>
            하는 편이 낫겠다는 의견이 있었습니다. 수입이 들쭉날쭉한 점을
            감안해 저도 그렇게 진행하는 것이 맞다고 판단했습니다.
          </p>
          <p>
            다만 이번 달 수익금이 꽤 커서, 이월 금액을 어떻게 운용할지는
            조금 더 고민 중입니다. 방향이 정해지면 공지로 다시 안내드리겠습니다.
          </p>
        </div>
      </div>

      <a
        href="https://naver.me/xpjvYJ9c"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 bg-linear-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 active:scale-[0.98] text-white font-black rounded-xl transition-all text-sm shadow-md shadow-teal-500/20"
      >
        <Megaphone className="w-4 h-4" />
        자세한 내역은 카페 글에서 확인하기
      </a>

      <p className="text-slate-500 dark:text-slate-400">
        요즘 사이트 유지보수에 신경을 많이 쓰지 못해 지표가 꽤 하락한 것도
        느끼고 있습니다. 최대한 열심히 개발하겠습니다. 늘 사이트를
        아껴주시고 후원해 주셔서 진심으로 감사합니다 💜
      </p>
    </div>
  );
}

function SettlementPostBody() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300 pt-3">
      <p>
        앞서 약속드린 대로,{' '}
        <strong className="text-slate-900 dark:text-white">
          후원 수익금 · 서버비 납부 · 남은 금액 기부
        </strong>
        를 투명하게 공개하기 위해 글을 남깁니다.
      </p>

      <div className="rounded-2xl border border-teal-200 dark:border-teal-800/50 bg-teal-50/70 dark:bg-teal-900/15 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <p className="font-black text-slate-900 dark:text-white text-sm">
            5월 정산 내역
          </p>
        </div>
        <div className="divide-y divide-teal-100 dark:divide-teal-900/40 overflow-hidden rounded-xl border border-teal-100 bg-white/70 dark:border-teal-900/40 dark:bg-slate-800/50">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="font-bold text-slate-600 dark:text-slate-300">
              후원 수익금
            </span>
            <span className="font-black text-emerald-600 dark:text-emerald-400">
              + 38,000원
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="font-bold text-slate-600 dark:text-slate-300">
              서버비{' '}
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                (tax 포함 $22 · 5/1 환율)
              </span>
            </span>
            <span className="font-black text-rose-500 dark:text-rose-400">
              − 33,888원
            </span>
          </div>
          <div className="flex items-center justify-between bg-teal-50/70 px-4 py-3 dark:bg-teal-900/20">
            <span className="font-black text-slate-800 dark:text-slate-100">
              잔여금
            </span>
            <span className="font-black text-slate-900 dark:text-white">
              4,112원
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 bg-pink-50 dark:bg-pink-900/15 border border-pink-200 dark:border-pink-800/50 rounded-2xl p-4">
        <Heart className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
        <p className="text-pink-700 dark:text-pink-300 text-sm">
          잔여금은 <strong>4,112원</strong>이지만, 그래도 가오 없이 4,112원만
          기부하기엔 좀 그래서{' '}
          <strong className="text-pink-800 dark:text-pink-200">
            10,000원을 채워 후원(기부)
          </strong>
          하기로 했습니다.
        </p>
      </div>

      <a
        href="https://naver.me/FUii09xf"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 bg-linear-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 active:scale-[0.98] text-white font-black rounded-xl transition-all text-sm shadow-md shadow-teal-500/20"
      >
        <Megaphone className="w-4 h-4" />
        자세한 내역은 카페 글에서 확인하기
      </a>

      <p className="text-slate-500 dark:text-slate-400">
        늘 사이트를 아껴주시고 후원해 주셔서 진심으로 감사합니다. 약속대로
        앞으로도 1원 단위까지 투명하게 공개하겠습니다 💜
      </p>
    </div>
  );
}

export default function AnnouncementsView({
  uptimeBadge = null,
}: {
  uptimeBadge?: ReactNode;
}) {
  const [isBackendOpen, setIsBackendOpen] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white dark:bg-slate-950 transition-colors">
      <OpenHashDetails />
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-3 py-5 sm:space-y-8 sm:px-4 sm:py-8">
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
              <h1 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
                공지사항
              </h1>
              <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">
                글 제목을 눌러 내용을 펼쳐 보세요
              </p>
              {uptimeBadge ? <div className="mt-3">{uptimeBadge}</div> : null}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <details
            id="settlement-2026-07"
            className="group scroll-mt-24 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-sm open:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none dark:open:bg-slate-900"
          >
            <summary className="cursor-pointer list-none px-4 py-4 marker:content-none sm:px-5 [&::-webkit-details-marker]:hidden">
              <span className="flex w-full items-start gap-3 text-left">
                <span className="min-w-0 flex-1 space-y-2">
                  <span className="flex flex-wrap items-center gap-2 gap-y-1">
                    <span
                      className={cn(
                        'inline-block rounded-full px-2.5 py-1 text-xs font-black',
                        'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
                      )}
                    >
                      정산 공개
                    </span>
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                      2026. 08. 03
                    </span>
                  </span>
                  <span className="block pr-1 text-base font-black leading-snug text-slate-900 dark:text-white sm:text-lg">
                    7월 후원 정산 · 잔여금 이월 안내
                  </span>
                  <span className="block text-sm font-medium leading-relaxed text-slate-500 group-open:hidden dark:text-slate-400">
                    수익금 15,000원, 서버비 35,601원, 잔여금 77,119원은 다음
                    달로 이월합니다.
                  </span>
                </span>
                <span className="mt-1 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 dark:text-slate-500">
                  <ChevronDown className="h-5 w-5" aria-hidden />
                </span>
              </span>
            </summary>
            <div className="border-t border-slate-100 px-4 pb-5 pt-1 dark:border-slate-800 sm:px-5">
              <SettlementJuly2026PostBody />
            </div>
          </details>

          <details
            id="update-2026-08"
            className="group scroll-mt-24 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-sm open:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none dark:open:bg-slate-900"
          >
            <summary className="cursor-pointer list-none px-4 py-4 marker:content-none sm:px-5 [&::-webkit-details-marker]:hidden">
              <span className="flex w-full items-start gap-3 text-left">
                <span className="min-w-0 flex-1 space-y-2">
                  <span className="flex flex-wrap items-center gap-2 gap-y-1">
                    <span
                      className={cn(
                        'inline-block rounded-full px-2.5 py-1 text-xs font-black',
                        'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
                      )}
                    >
                      업데이트
                    </span>
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                      2026. 08. 02
                    </span>
                  </span>
                  <span className="block pr-1 text-base font-black leading-snug text-slate-900 dark:text-white sm:text-lg">
                    LIVE 미리보기 · 일정 LIVE · 클립 호버 재생
                  </span>
                  <span className="block text-sm font-medium leading-relaxed text-slate-500 group-open:hidden dark:text-slate-400">
                    스트리머·일정 LIVE 미리보기, 클립 호버 재생, 소리 켜기(화면 클릭).
                    Chrome 확장 1.3.0이 필요합니다.
                  </span>
                </span>
                <span className="mt-1 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 dark:text-slate-500">
                  <ChevronDown className="h-5 w-5" aria-hidden />
                </span>
              </span>
            </summary>
            <div className="border-t border-slate-100 px-4 pb-5 pt-1 dark:border-slate-800 sm:px-5">
              <UpdateAugust2026PostBody />
            </div>
          </details>

          <details
            id="settlement-2026-06"
            className="group scroll-mt-24 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-sm open:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none dark:open:bg-slate-900"
          >
            <summary className="cursor-pointer list-none px-4 py-4 marker:content-none sm:px-5 [&::-webkit-details-marker]:hidden">
              <span className="flex w-full items-start gap-3 text-left">
                <span className="min-w-0 flex-1 space-y-2">
                  <span className="flex flex-wrap items-center gap-2 gap-y-1">
                    <span
                      className={cn(
                        'inline-block rounded-full px-2.5 py-1 text-xs font-black',
                        'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
                      )}
                    >
                      정산 공개
                    </span>
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                      2026. 07. 01
                    </span>
                  </span>
                  <span className="block pr-1 text-base font-black leading-snug text-slate-900 dark:text-white sm:text-lg">
                    6월 후원 정산 · 잔여금 이월 안내
                  </span>
                  <span className="block text-sm font-medium leading-relaxed text-slate-500 group-open:hidden dark:text-slate-400">
                    수익금 136,000원, 서버비 38,280원, 잔여금 97,720원은 다음
                    달로 이월합니다.
                  </span>
                </span>
                <span className="mt-1 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 dark:text-slate-500">
                  <ChevronDown className="h-5 w-5" aria-hidden />
                </span>
              </span>
            </summary>
            <div className="border-t border-slate-100 px-4 pb-5 pt-1 dark:border-slate-800 sm:px-5">
              <SettlementJune2026PostBody />
            </div>
          </details>

          <details
            id="update-2026-06"
            className="group scroll-mt-24 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-sm open:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none dark:open:bg-slate-900"
          >
            <summary className="cursor-pointer list-none px-4 py-4 marker:content-none sm:px-5 [&::-webkit-details-marker]:hidden">
              <span className="flex w-full items-start gap-3 text-left">
                <span className="min-w-0 flex-1 space-y-2">
                  <span className="flex flex-wrap items-center gap-2 gap-y-1">
                    <span
                      className={cn(
                        'inline-block rounded-full px-2.5 py-1 text-xs font-black',
                        'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
                      )}
                    >
                      업데이트
                    </span>
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                      2026. 06. 11
                    </span>
                  </span>
                  <span className="block pr-1 text-base font-black leading-snug text-slate-900 dark:text-white sm:text-lg">
                    백엔드 모니터링 · 멀티뷰 · 설정 개선
                  </span>
                  <span className="block text-sm font-medium leading-relaxed text-slate-500 group-open:hidden dark:text-slate-400">
                    상태 페이지 히트맵, Cron 수집, 멀티뷰 안내·단축키, 설정 링크를
                    추가했습니다.
                  </span>
                </span>
                <span className="mt-1 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 dark:text-slate-500">
                  <ChevronDown className="h-5 w-5" aria-hidden />
                </span>
              </span>
            </summary>
            <div className="border-t border-slate-100 px-4 pb-5 pt-1 dark:border-slate-800 sm:px-5">
              <UpdateJune2026PostBody />
            </div>
          </details>

          <details
            id="settlement-2026-05"
            className="group scroll-mt-24 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-sm open:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none dark:open:bg-slate-900"
          >
            <summary className="cursor-pointer list-none px-4 py-4 marker:content-none sm:px-5 [&::-webkit-details-marker]:hidden">
              <span className="flex w-full items-start gap-3 text-left">
                <span className="min-w-0 flex-1 space-y-2">
                  <span className="flex flex-wrap items-center gap-2 gap-y-1">
                    <span
                      className={cn(
                        'inline-block rounded-full px-2.5 py-1 text-xs font-black',
                        'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
                      )}
                    >
                      정산 공개
                    </span>
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                      2026. 06. 01
                    </span>
                  </span>
                  <span className="block pr-1 text-base font-black leading-snug text-slate-900 dark:text-white sm:text-lg">
                    5월 후원 정산 · 기부 내역 공개
                  </span>
                  <span className="block text-sm font-medium leading-relaxed text-slate-500 group-open:hidden dark:text-slate-400">
                    수익금 38,000원, 서버비 33,888원, 잔여금은 1만원으로 채워
                    기부합니다.
                  </span>
                </span>
                <span className="mt-1 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 dark:text-slate-500">
                  <ChevronDown className="h-5 w-5" aria-hidden />
                </span>
              </span>
            </summary>
            <div className="border-t border-slate-100 px-4 pb-5 pt-1 dark:border-slate-800 sm:px-5">
              <SettlementPostBody />
            </div>
          </details>

          <details
            id="api-ui-update-2026-05"
            className="group scroll-mt-24 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-sm open:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none dark:open:bg-slate-900"
          >
            <summary className="cursor-pointer list-none px-4 py-4 marker:content-none sm:px-5 [&::-webkit-details-marker]:hidden">
              <span className="flex w-full items-start gap-3 text-left">
                <span className="min-w-0 flex-1 space-y-2">
                  <span className="flex flex-wrap items-center gap-2 gap-y-1">
                    <span
                      className={cn(
                        'inline-block rounded-full px-2.5 py-1 text-xs font-black',
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
                      )}
                    >
                      업데이트
                    </span>
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                      2026. 05. 15
                    </span>
                  </span>
                  <span className="block pr-1 text-base font-black leading-snug text-slate-900 dark:text-white sm:text-lg">
                    API 연동 완료 · 새 캘린더 UI 적용
                  </span>
                  <span className="block text-sm font-medium leading-relaxed text-slate-500 group-open:hidden dark:text-slate-400">
                    map-dyoa-server API 전환과 V2 캘린더·일정 모달이 기본으로
                    적용되었습니다.
                  </span>
                </span>
                <span className="mt-1 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 dark:text-slate-500">
                  <ChevronDown className="h-5 w-5" aria-hidden />
                </span>
              </span>
            </summary>
            <div className="border-t border-slate-100 px-4 pb-5 pt-1 dark:border-slate-800 sm:px-5">
              <ApiUiUpdatePostBody />
            </div>
          </details>

          <details
            id="backend-split-2026-05"
            className="group scroll-mt-24 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-sm open:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none dark:open:bg-slate-900"
            onToggle={(event) => setIsBackendOpen(event.currentTarget.open)}
          >
            <summary className="cursor-pointer list-none px-4 py-4 marker:content-none sm:px-5 [&::-webkit-details-marker]:hidden">
              <span className="flex w-full items-start gap-3 text-left">
                <span className="min-w-0 flex-1 space-y-2">
                  <span className="flex flex-wrap items-center gap-2 gap-y-1">
                    <span
                      className={cn(
                        'inline-block rounded-full px-2.5 py-1 text-xs font-black',
                        'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
                      )}
                    >
                      개발 진행
                    </span>
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                      2026. 05. 11
                    </span>
                  </span>
                  <span className="block pr-1 text-base font-black leading-snug text-slate-900 dark:text-white sm:text-lg">
                    백엔드 분리 프로젝트 1차 진행
                  </span>
                  <span className="block text-sm font-medium leading-relaxed text-slate-500 group-open:hidden dark:text-slate-400">
                    Bun · Elysia · Drizzle 기반 신규 서버 초기 구성을
                    완료했습니다.
                  </span>
                </span>
                <span className="mt-1 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 dark:text-slate-500">
                  <ChevronDown className="h-5 w-5" aria-hidden />
                </span>
              </span>
            </summary>
            <div className="border-t border-slate-100 px-4 pb-5 pt-1 dark:border-slate-800 sm:px-5">
              <BackendProjectPostBody active={isBackendOpen} />
            </div>
          </details>

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
                    앱처럼 설치해 빠르게 열고, 웹 푸시 알림과 함께 쓰는 방법을
                    정리했습니다.
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
