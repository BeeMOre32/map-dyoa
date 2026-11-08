'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { Accordion } from '@heroui/react';
import { buttonVariants } from '@heroui/styles';
import {
  ApiUiUpdatePostBody,
  BackendProjectPostBody,
  DonationPostBody,
  PwaPostBody,
  SettlementAugust2026PostBody,
  SettlementJuly2026PostBody,
  SettlementJune2026PostBody,
  SettlementOctober2026PostBody,
  SettlementPostBody,
  SettlementSeptember2026PostBody,
  UpdateAugust2026PostBody,
  UpdateAugustHealth2026PostBody,
  UpdateJune2026PostBody,
  UpdateOctober2026PostBody,
} from './announcement-posts';
import { KindChip } from './notice-ui';

type AccordionKey = string | number;

function NoticeItem({
  id,
  kind,
  date,
  title,
  summary,
  children,
}: {
  id: string;
  kind: string;
  date: string;
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <Accordion.Item
      id={id}
      className="group scroll-mt-24 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
    >
      <Accordion.Heading>
        <Accordion.Trigger className="!h-auto !items-start !justify-start !py-3">
          <span className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left">
            <span className="flex flex-wrap items-center gap-2">
              <KindChip>{kind}</KindChip>
              <span className="text-xs text-zinc-500">{date}</span>
            </span>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{title}</span>
            <span className="text-sm text-zinc-500 group-data-[expanded]:hidden">{summary}</span>
          </span>
          <Accordion.Indicator />
        </Accordion.Trigger>
      </Accordion.Heading>
      <Accordion.Panel>
        <Accordion.Body>{children}</Accordion.Body>
      </Accordion.Panel>
    </Accordion.Item>
  );
}

export default function AnnouncementsView({
  uptimeBadge = null,
}: {
  uptimeBadge?: ReactNode;
}) {
  const [expanded, setExpanded] = useState<Set<AccordionKey>>(
    () => new Set(['settlement-2026-10']),
  );

  useEffect(() => {
    const apply = () => {
      const slug = window.location.hash.replace(/^#/, '');
      if (!slug) return;
      setExpanded((prev) => {
        const next = new Set(prev);
        next.add(slug);
        return next;
      });
      requestAnimationFrame(() => {
        document.getElementById(slug)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white dark:bg-slate-950">
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-3 py-5 sm:px-4 sm:py-8">
        <div className="space-y-4">
          <Link href="/" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            돌아가기
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-2xl">
              공지사항
            </h1>
            <p className="mt-1 text-sm text-zinc-500">제목을 누르면 글이 열립니다.</p>
            {uptimeBadge ? <div className="mt-3">{uptimeBadge}</div> : null}
          </div>
        </div>

        <Accordion
          hideSeparator
          allowsMultipleExpanded
          expandedKeys={expanded}
          onExpandedChange={setExpanded}
          className="flex flex-col gap-3"
        >
          <NoticeItem
            id="settlement-2026-10"
            kind="정산 공개"
            date="2026. 11. 08"
            title="10월 후원 정산 · 잔여금 이월 안내"
            summary="수익금 10,000원, 서버비 31,243원, 잔여금 100,187원은 다음 달로 이월합니다."
          >
            <SettlementOctober2026PostBody />
          </NoticeItem>
          <NoticeItem
            id="update-2026-10"
            kind="업데이트"
            date="2026. 10. 11"
            title="캘린더 v3 베타 · 방송 자동 등록"
            summary="주간 캘린더에 지금 방송과 자동 일정을 짧게 표시하고, 설정에서 의견을 보낼 수 있습니다."
          >
            <UpdateOctober2026PostBody />
          </NoticeItem>
          <NoticeItem
            id="settlement-2026-09"
            kind="정산 공개"
            date="2026. 10. 10"
            title="9월 후원 정산 · 잔여금 이월 안내"
            summary="수익금 79,000원, 서버비 31,553원, 잔여금 121,430원은 다음 달로 이월합니다."
          >
            <SettlementSeptember2026PostBody />
          </NoticeItem>
          <NoticeItem
            id="settlement-2026-08"
            kind="정산 공개"
            date="2026. 09. 06"
            title="8월 후원 정산 · 잔여금 이월 안내"
            summary="수익금 30,000원, 서버비 33,136원, 잔여금 73,983원은 다음 달로 이월합니다."
          >
            <SettlementAugust2026PostBody />
          </NoticeItem>
          <NoticeItem
            id="update-2026-08-08"
            kind="업데이트"
            date="2026. 08. 08"
            title="라이브 메타 안정화 · 기능별 백엔드 헬스"
            summary="live-meta 502 완화, 서버·DB·일정·멤버·클립 30분 헬스, 14일 기능별 히트맵."
          >
            <UpdateAugustHealth2026PostBody />
          </NoticeItem>
          <NoticeItem
            id="settlement-2026-07"
            kind="정산 공개"
            date="2026. 08. 03"
            title="7월 후원 정산 · 잔여금 이월 안내"
            summary="수익금 15,000원, 서버비 35,601원, 잔여금 77,119원은 다음 달로 이월합니다."
          >
            <SettlementJuly2026PostBody />
          </NoticeItem>
          <NoticeItem
            id="update-2026-08"
            kind="업데이트"
            date="2026. 08. 02"
            title="LIVE 미리보기 · 일정 LIVE · 클립 호버 재생"
            summary="스트리머·일정 LIVE 미리보기, 클립 호버 재생, 소리 켜기(화면 클릭). Chrome 확장 1.3.0이 필요합니다."
          >
            <UpdateAugust2026PostBody />
          </NoticeItem>
          <NoticeItem
            id="settlement-2026-06"
            kind="정산 공개"
            date="2026. 07. 01"
            title="6월 후원 정산 · 잔여금 이월 안내"
            summary="수익금 136,000원, 서버비 38,280원, 잔여금 97,720원은 다음 달로 이월합니다."
          >
            <SettlementJune2026PostBody />
          </NoticeItem>
          <NoticeItem
            id="update-2026-06"
            kind="업데이트"
            date="2026. 06. 11"
            title="백엔드 모니터링 · 멀티뷰 · 설정 개선"
            summary="상태 페이지 히트맵, Cron 수집, 멀티뷰 안내·단축키, 설정 링크를 추가했습니다."
          >
            <UpdateJune2026PostBody />
          </NoticeItem>
          <NoticeItem
            id="settlement-2026-05"
            kind="정산 공개"
            date="2026. 06. 01"
            title="5월 후원 정산 · 기부 내역 공개"
            summary="수익금 38,000원, 서버비 33,888원, 잔여금은 1만원으로 채워 기부합니다."
          >
            <SettlementPostBody />
          </NoticeItem>
          <NoticeItem
            id="api-ui-update-2026-05"
            kind="업데이트"
            date="2026. 05. 15"
            title="API 연동 완료 · 새 캘린더 UI 적용"
            summary="map-dyoa-server API 전환과 V2 캘린더·일정 모달이 기본으로 적용되었습니다."
          >
            <ApiUiUpdatePostBody />
          </NoticeItem>
          <NoticeItem
            id="backend-split-2026-05"
            kind="개발 진행"
            date="2026. 05. 11"
            title="백엔드 분리 프로젝트 1차 진행"
            summary="Bun · Elysia · Drizzle 기반 신규 서버 초기 구성을 완료했습니다."
          >
            <BackendProjectPostBody />
          </NoticeItem>
          <NoticeItem
            id="pwa"
            kind="기능 안내"
            date="2026. 05. 10"
            title="PWA · 홈 화면에 추가하기"
            summary="앱처럼 설치해 빠르게 열고, 웹 푸시 알림과 함께 쓰는 방법을 정리했습니다."
          >
            <PwaPostBody />
          </NoticeItem>
          <NoticeItem
            id="donation-2025-05"
            kind="운영 안내"
            date="2025. 05. 03"
            title="서버 업그레이드 및 후원 시스템 안내"
            summary="서버 상황, 후원금·기부 약속, 투명 공개 계획을 안내드립니다."
          >
            <DonationPostBody />
          </NoticeItem>
        </Accordion>
      </div>
    </div>
  );
}
