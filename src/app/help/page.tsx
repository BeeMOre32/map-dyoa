'use client';

import { motion } from 'framer-motion';
import {
  BookOpen,
  CalendarDays,
  MousePointerClick,
  Edit2,
  Trash2,
  LogIn,
  Sparkles,
  ArrowRight,
  Gamepad2,
  Users,
  Mail,
  LayoutGrid,
  Search,
  Palette,
  Keyboard,
  ExternalLink,
  Clock,
  SlidersHorizontal,
  Radio,
  Clapperboard,
  Puzzle,
  Move,
  Sword,
  Wifi,
  EyeOff,
  Bot,
  Smartphone,
  AlertTriangle,
  Star,
  Link2,
  Megaphone,
  History,
  BarChart3,
  Shield,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

const ease = [0.25, 0.46, 0.45, 0.94] as const;

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.55, ease },
};

function SectionCard({
  id,
  icon,
  iconBg,
  title,
  children,
}: {
  id?: string;
  icon: ReactNode;
  iconBg: string;
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <motion.section
      id={id}
      {...fadeUp}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-xl hover:shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-800 dark:hover:shadow-black/30 sm:rounded-[2.5rem] sm:p-6 md:p-8"
    >
      <div className="mb-4 flex items-center gap-3 sm:mb-6 sm:gap-4">
        <div className={`rounded-xl p-2.5 sm:rounded-2xl sm:p-3 ${iconBg}`}>{icon}</div>
        <h2 className="text-lg font-black text-slate-800 dark:text-white sm:text-xl md:text-2xl">
          {title}
        </h2>
      </div>
      {children}
    </motion.section>
  );
}

function Row({
  icon,
  delay = 0,
  children,
}: {
  icon: ReactNode;
  delay?: number;
  children: ReactNode;
}) {
  return (
    <motion.p
      className="flex items-start gap-3"
      initial={{ opacity: 0, x: -14 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.38, ease, delay }}
    >
      <span className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500">{icon}</span>
      <span className="font-medium leading-relaxed text-slate-600 dark:text-slate-300">
        {children}
      </span>
    </motion.p>
  );
}

function Tip({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-900/10">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400" />
      <span className="text-sm font-bold text-amber-800 dark:text-amber-300">{children}</span>
    </div>
  );
}

function LiveBadge() {
  return (
    <span className="mx-1 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 align-middle dark:bg-red-900/20">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
      </span>
      <span className="text-[9px] font-black uppercase tracking-wide text-red-500">live</span>
    </span>
  );
}

function MiniCardGrid({
  items,
}: {
  items: { icon: ReactNode; label: string; desc: ReactNode }[];
}) {
  return (
    <div className="grid gap-4 pt-1 sm:grid-cols-3">
      {items.map(({ icon, label, desc }, i) => (
        <motion.div
          key={label}
          className="rounded-3xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-600 dark:bg-slate-700"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4, ease, delay: i * 0.07 }}
          whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
        >
          <div className="mb-2 flex items-center gap-2 text-sm font-black text-slate-800 dark:text-white">
            {icon}
            {label}
          </div>
          <p className="text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">
            {desc}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

const TOC = [
  { href: '#overview', label: '소개' },
  { href: '#nav', label: '탭' },
  { href: '#calendar', label: '캘린더' },
  { href: '#favorites', label: '관심 멤버' },
  { href: '#schedule', label: '일정·공유' },
  { href: '#members', label: '멤버·라이브' },
  { href: '#multiview', label: '멀티뷰' },
  { href: '#clips', label: '클립' },
  { href: '#hoi4', label: 'HOI4' },
  { href: '#edit', label: '편집' },
  { href: '#settings', label: '설정' },
  { href: '#errors', label: '오류' },
];

export default function HelpPage() {
  return (
    <div className="custom-scrollbar flex-1 overflow-y-auto bg-slate-50/50 px-4 py-12 transition-colors dark:bg-slate-950 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6 pb-12">
        {/* 헤더 */}
        <div className="mb-10 space-y-3 text-center">
          <motion.div
            className="mb-2 inline-flex items-center justify-center rounded-3xl bg-indigo-100 p-4 text-indigo-600 shadow-sm dark:bg-indigo-900/20 dark:text-indigo-400"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <BookOpen className="h-10 w-10" />
          </motion.div>
          <motion.h1
            className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease }}
          >
            이용 가이드
          </motion.h1>
          <motion.p
            className="text-lg font-bold text-slate-500 dark:text-slate-400"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.15 }}
          >
            지금 Map-Dyoa에 있는 기능만 정리했습니다
          </motion.p>
        </div>

        {/* 목차 */}
        <motion.nav
          {...fadeUp}
          className="flex flex-wrap justify-center gap-2"
          aria-label="목차"
        >
          {TOC.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-indigo-400"
            >
              {label}
            </a>
          ))}
        </motion.nav>

        {/* 최근 업데이트 */}
        <motion.div
          {...fadeUp}
          className="rounded-4xl border border-indigo-100 bg-indigo-50 p-6 shadow-sm dark:border-indigo-800/40 dark:bg-indigo-900/15"
        >
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
            <h2 className="text-lg font-black text-indigo-700 dark:text-indigo-300">
              최근 업데이트
            </h2>
          </div>
          <ul className="list-inside list-disc space-y-2 text-sm font-bold text-indigo-700/90 dark:text-indigo-200/90">
            <li>
              <strong>V2 캘린더·일정 모달</strong>이 기본 UI입니다. 설정에서 구버전으로
              되돌릴 수 있습니다.
            </li>
            <li>
              <strong>HOI4 전적</strong> — 멤버·국가·기간 필터, 내전 뱃지, 게스트 국가 집계
              (승패 기록은 사용하지 않습니다)
            </li>
            <li>
              <strong>동시 수정 방지</strong> — 두 관리자가 같은 일정을 동시에 저장하면 충돌
              안내 후 새로고침을 요청합니다
            </li>
            <li>
              일정·전적 데이터는 <strong>map-dyoa-server</strong> API로 동기화됩니다
            </li>
          </ul>
          <Link
            href="/announcements"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-black text-indigo-600 hover:underline dark:text-indigo-400"
          >
            <Megaphone className="h-4 w-4" />
            공지사항에서 자세히 보기
          </Link>
        </motion.div>

        {/* 소개 */}
        <SectionCard
          id="overview"
          icon={<BookOpen className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />}
          iconBg="bg-indigo-50 dark:bg-indigo-900/20"
          title="서비스 소개"
        >
          <div className="space-y-4">
            <p className="font-medium leading-relaxed text-slate-600 dark:text-slate-300">
              <strong>Map-Dyoa</strong>는 지도동 멤버의{' '}
              <strong>합방 일정</strong>, <strong>라이브 상태</strong>,{' '}
              <strong>클립</strong>, <strong>HOI4 내전 전적</strong>을 한곳에서 보는 팬
              서비스입니다. 대부분은 로그인 없이 이용할 수 있고, 일정·클립 기여는 구글
              로그인 후 가능합니다.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { href: '/calendar', label: '스케줄', desc: '주간·월간 캘린더' },
                { href: '/streamers', label: '멤버·라이브', desc: '프로필·방송 중 목록' },
                { href: '/clips', label: '클립', desc: '치지직 클립 모음' },
                { href: '/hoi4', label: '전적', desc: 'HOI4 내전·국가 통계' },
              ].map(({ href, label, desc }) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 transition-colors hover:border-indigo-200 dark:border-slate-600 dark:bg-slate-700/50 dark:hover:border-indigo-700"
                >
                  <p className="font-black text-slate-800 dark:text-white">{label}</p>
                  <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {desc}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* 하단 탭 */}
        <SectionCard
          id="nav"
          icon={<LayoutGrid className="h-6 w-6 text-slate-500 dark:text-slate-400" />}
          iconBg="bg-slate-100 dark:bg-slate-700"
          title="하단 탭"
        >
          <motion.div className="space-y-4">
            <Row icon={<CalendarDays className="h-5 w-5" />}>
              <strong>스케줄</strong> — 합방 일정 캘린더(기본 홈)
            </Row>
            <Row icon={<Users className="h-5 w-5" />} delay={0.06}>
              <strong>멤버·라이브</strong> — 멤버 카드·치지직 라이브 여부·멀티뷰 선택. 방송
              중이면 탭이 붉게 강조됩니다.
            </Row>
            <Row icon={<Clapperboard className="h-5 w-5" />} delay={0.12}>
              <strong>클립</strong> — 멤버·월별·검색·관심 멤버 필터
            </Row>
            <Row icon={<Sword className="h-5 w-5" />} delay={0.18}>
              <strong>전적</strong> — HOI4 내전 세션·멤버별 참전 통계·필터
            </Row>
            <Tip>
              일정·멤버 상세·멀티뷰가 열리면 하단 탭은 잠시 숨겨져 화면을 넓게 씁니다.
            </Tip>
          </motion.div>
        </SectionCard>

        {/* 캘린더 */}
        <SectionCard
          id="calendar"
          icon={<CalendarDays className="h-6 w-6 text-blue-500 dark:text-blue-400" />}
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          title="캘린더 (스케줄)"
        >
          <div className="space-y-4">
            <Row icon={<LayoutGrid className="h-5 w-5" />}>
              상단 <strong>주간 / 월간</strong> 전환, <strong>← →</strong>로 이전·다음
              주·월 이동. 기본은 <strong>V2 카드형</strong> 레이아웃입니다.
            </Row>
            <Row icon={<MousePointerClick className="h-5 w-5" />} delay={0.06}>
              날짜 칸·카드를 누르면 <strong>일정 상세 모달</strong>이 열립니다. HOI4
              내전 일정에는 <strong>내전</strong> 뱃지가 붙습니다.
            </Row>
            <Row icon={<SlidersHorizontal className="h-5 w-5" />} delay={0.12}>
              캘린더 상단 <strong>필터 바</strong>에서 멤버·게임별로 일정을 걸러 볼 수
              있습니다. 이름·<strong>초성</strong> 검색(
              <code className="rounded bg-slate-100 px-1 py-0.5 text-xs font-black dark:bg-slate-700">
                ㄷㅁ
              </code>{' '}
              등)과 멤버 옆 <strong>별</strong> 등록도 여기서 합니다.
            </Row>
            <Row icon={<Gamepad2 className="h-5 w-5" />} delay={0.18}>
              게임이 연결된 일정은 <strong>게임 색</strong> 배경, 카드 하단 배지는{' '}
              <strong>멤버 고유 색</strong>입니다. <strong>시간 미정</strong>은 게릴라
              일정, 오늘 방송 중인 참여자에게 <LiveBadge /> 표시.
            </Row>
            <Row icon={<EyeOff className="h-5 w-5" />} delay={0.24}>
              상단 헤더 <strong>설정(톱니)</strong>에서{' '}
              <strong>종료된 방송 숨기기</strong>를 켜면 완료 처리된 일정 카드가
              사라집니다.
            </Row>
            <Row icon={<BarChart3 className="h-5 w-5" />} delay={0.3}>
              <Link
                href="/calendar/monthly"
                className="font-black text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
              >
                지도동 통계
              </Link>
              에서 월별 TOP 멤버·게임·내전 횟수 등을 볼 수 있습니다.
            </Row>
          </div>
        </SectionCard>

        {/* 관심 멤버 */}
        <SectionCard
          id="favorites"
          icon={<Star className="h-6 w-6 text-amber-500 dark:text-amber-400" />}
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          title="관심 멤버 (즐겨찾기)"
        >
          <div className="space-y-4">
            <Row icon={<Star className="h-5 w-5" />}>
              캘린더 필터 바에서 멤버 옆 <strong>별</strong>을 누르면 관심 멤버로
              등록됩니다. 브라우저에 저장되며 기기마다 따로 유지됩니다.
            </Row>
            <Row icon={<SlidersHorizontal className="h-5 w-5" />} delay={0.06}>
              캘린더·멤버·클립·<strong>HOI4 전적</strong> 상단의{' '}
              <strong>전체 / 관심 멤버</strong> 토글으로 관심 멤버만 볼 수 있습니다.
            </Row>
            <Row icon={<Clapperboard className="h-5 w-5" />} delay={0.12}>
              클립 탭에서는 관심 멤버 필터 시 URL에 반영되어 링크로 상태를 공유할 수
              있습니다.
            </Row>
          </div>
        </SectionCard>

        {/* 일정 상세·공유 */}
        <SectionCard
          id="schedule"
          icon={<Link2 className="h-6 w-6 text-sky-500 dark:text-sky-400" />}
          iconBg="bg-sky-50 dark:bg-sky-900/20"
          title="일정 상세 · 링크 공유"
        >
          <motion.div className="space-y-4">
            <Row icon={<Clock className="h-5 w-5" />}>
              상세에서 <strong>날짜·시간·게임·참여 멤버</strong>, 등록된{' '}
              <strong>방송·다시보기 링크</strong>를 볼 수 있습니다.
            </Row>
            <Row icon={<Sword className="h-5 w-5" />} delay={0.06}>
              HOI4 게임 일정은 데스크탑에서 <strong>사이드 패널</strong>로 참여 멤버별{' '}
              <strong>플레이 국가</strong>를 함께 표시합니다.
            </Row>
            <Row icon={<Users className="h-5 w-5" />} delay={0.12}>
              멤버 이름을 누르면 <strong>멤버 상세</strong>로 이동합니다.
            </Row>
            <Row icon={<Link2 className="h-5 w-5" />} delay={0.18}>
              하단 <strong>링크 복사</strong>는 일정 전용 URL을 클립보드에 넣습니다.{' '}
              <strong>공유</strong>는 휴대폰 OS 공유 시트를 엽니다(미지원 시 복사로
              대체).
            </Row>
            <Row icon={<ExternalLink className="h-5 w-5" />} delay={0.24}>
              공유 링크를 SNS·메신저에 붙이면 <strong>미리보기 카드</strong>로
              제목·일시·멤버가 함께 보입니다.
            </Row>
            <Row icon={<LayoutGrid className="h-5 w-5" />} delay={0.3}>
              <strong>멀티뷰로 보기</strong>로 이 일정 참여 멤버 방송을 한 화면에 띄울
              수 있습니다.
            </Row>
          </motion.div>
        </SectionCard>

        {/* 멤버·라이브 */}
        <SectionCard
          id="members"
          icon={<Radio className="h-6 w-6 text-red-500 dark:text-red-400" />}
          iconBg="bg-red-50 dark:bg-red-900/20"
          title="멤버 · 라이브"
        >
          <div className="space-y-4">
            <Row icon={<Users className="h-5 w-5" />}>
              <Link
                href="/streamers"
                className="font-black text-indigo-600 hover:underline dark:text-indigo-400"
              >
                멤버·라이브
              </Link>
              에서 전체 멤버 카드, <strong>기수 필터</strong>, 이름·초성 검색을 씁니다.
            </Row>
            <Row icon={<Wifi className="h-5 w-5" />} delay={0.06}>
              치지직 <strong>방송 중</strong> 멤버는 상단에 모이고, 상태는 약{' '}
              <strong>60초마다</strong> 자동 갱신됩니다.
            </Row>
            <Row icon={<LayoutGrid className="h-5 w-5" />} delay={0.12}>
              카드의{' '}
              <LayoutGrid className="mx-0.5 inline h-3.5 w-3.5 align-text-bottom" />
              로 멀티뷰에 추가합니다(최대 9명). 하단 바에서 순서를{' '}
              <strong>드래그</strong>해 바꿀 수 있습니다.
            </Row>
            <Row icon={<ExternalLink className="h-5 w-5" />} delay={0.18}>
              치지직 바로가기·카드 메뉴의 <strong>정보 수정 요청</strong>으로 프로필
              오류를 제보할 수 있습니다.
            </Row>
          </div>
        </SectionCard>

        {/* 멀티뷰 */}
        <SectionCard
          id="multiview"
          icon={<LayoutGrid className="h-6 w-6 text-cyan-500 dark:text-cyan-400" />}
          iconBg="bg-cyan-50 dark:bg-cyan-900/20"
          title="멀티뷰 · Chrome 확장"
        >
          <div className="space-y-4">
            <Row icon={<LayoutGrid className="h-5 w-5" />}>
              멤버 선택 후 <strong>멀티뷰 시작</strong>, 또는 일정 상세의 멀티뷰 버튼으로
              진입합니다.
            </Row>
            <Row icon={<Move className="h-5 w-5" />} delay={0.06}>
              패널 사이를 드래그해 <strong>크기 조절</strong>, 상단 버튼으로 순서 변경·
              <strong>집중 모드</strong>(한 방송 크게)를 쓸 수 있습니다.
            </Row>
            <Row icon={<Puzzle className="h-5 w-5" />} delay={0.12}>
              치지직 로그인 유지를 위해 <strong>Map-Dyoa 멀티뷰 도우미</strong> Chrome
              확장 설치를 권장합니다.
            </Row>
            <motion.a
              href="https://chromewebstore.google.com/detail/jmehpmfkiciefbgoebiljadeamohkgfb"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition-colors hover:bg-cyan-700"
            >
              <ExternalLink className="h-4 w-4" />
              Chrome 웹스토어에서 설치
            </motion.a>
          </div>
        </SectionCard>

        {/* 클립 */}
        <SectionCard
          id="clips"
          icon={<Clapperboard className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />}
          iconBg="bg-indigo-50 dark:bg-indigo-900/20"
          title="클립 모음"
        >
          <div className="space-y-4">
            <Row icon={<Clapperboard className="h-5 w-5" />}>
              치지직 클립 URL을 넣으면 <strong>썸네일·제목</strong>을 자동으로
              가져옵니다.
            </Row>
            <Row icon={<Search className="h-5 w-5" />} delay={0.06}>
              <strong>멤버·연월·검색어·관심 멤버</strong> 필터, 20개 단위 페이지네이션.
            </Row>
            <MiniCardGrid
              items={[
                {
                  icon: <Sparkles className="h-4 w-4 text-indigo-500" />,
                  label: '추가',
                  desc: (
                    <>
                      로그인 후 <strong>+ 클립 추가</strong>
                    </>
                  ),
                },
                {
                  icon: <Edit2 className="h-4 w-4 text-indigo-500" />,
                  label: '수정',
                  desc: <>카드의 연필 아이콘</>,
                },
                {
                  icon: <Trash2 className="h-4 w-4 text-red-500" />,
                  label: '삭제',
                  desc: <>휴지통 아이콘 (복구 불가)</>,
                },
              ]}
            />
          </div>
        </SectionCard>

        {/* HOI4 */}
        <SectionCard
          id="hoi4"
          icon={<Sword className="h-6 w-6 text-amber-500 dark:text-amber-400" />}
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          title="HOI4 전적"
        >
          <div className="space-y-4">
            <Row icon={<Sword className="h-5 w-5" />}>
              <Link
                href="/hoi4"
                className="font-black text-indigo-600 hover:underline dark:text-indigo-400"
              >
                전적
              </Link>{' '}
              탭에서 HOI4 <strong>내전 세션</strong>과 멤버별{' '}
              <strong>참전·플레이 국가</strong> 통계를 봅니다. 승패는 기록하지
              않습니다.
            </Row>
            <Row icon={<SlidersHorizontal className="h-5 w-5" />} delay={0.06}>
              상단 <strong>필터</strong> — <strong>멤버</strong>,{' '}
              <strong>국가 검색</strong>, <strong>기간(3·6·12개월)</strong>,{' '}
              <strong>관심 멤버</strong> 토글. 필터에 맞는 세션·통계만 다시
              집계됩니다.
            </Row>
            <Row icon={<Gamepad2 className="h-5 w-5" />} delay={0.12}>
              전적에 포함하려면 일정 수정에서 HOI4 게임 선택 후{' '}
              <strong>내전 세션</strong>을 체크하거나, 멤버별 <strong>국가</strong>를
              입력하세요. 국가를 입력하면 내전이 자동으로 켜집니다.
            </Row>
            <Row icon={<Users className="h-5 w-5" />} delay={0.18}>
              <strong>게스트</strong>도 내전 세션일 때 국가를 입력하면 전적에
              포함됩니다.
            </Row>
            <Row icon={<CalendarDays className="h-5 w-5" />} delay={0.24}>
              캘린더·일정 상세에서 HOI4 내전 일정은 <strong>내전</strong> 뱃지로
              구분됩니다.
            </Row>
            <Tip>
              세션 목록은 <strong>더 보기</strong>로 펼칠 수 있습니다. 멤버 그리드를
              누르면 멤버 상세로 이동합니다.
            </Tip>
          </div>
        </SectionCard>

        {/* 편집·로그인 */}
        <SectionCard
          id="edit"
          icon={<LogIn className="h-6 w-6 text-amber-500 dark:text-amber-400" />}
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          title="로그인 · 일정·클립 편집"
        >
          <div className="space-y-4">
            <Row icon={<LogIn className="h-5 w-5" />}>
              상단 헤더 <strong>설정 → 로그인</strong>으로 구글 계정에 연결합니다.
              로그인하면 일정·클립 <strong>추가·수정·삭제</strong> 버튼이 보입니다.
            </Row>
            <MiniCardGrid
              items={[
                {
                  icon: <Sparkles className="h-4 w-4 text-indigo-500" />,
                  label: '일정 추가',
                  desc: (
                    <>
                      <strong>+ 일정 추가</strong> · AI 텍스트/이미지 추출 ·{' '}
                      <strong>연속 작성</strong>
                    </>
                  ),
                },
                {
                  icon: <Edit2 className="h-4 w-4 text-indigo-500" />,
                  label: '일정 수정',
                  desc: (
                    <>
                      상세 모달에서 수정. HOI4는 <strong>내전·국가</strong> 입력
                    </>
                  ),
                },
                {
                  icon: <Bot className="h-4 w-4 text-violet-500" />,
                  label: 'AI 추출',
                  desc: (
                    <>
                      공지 캡처·텍스트에서 일정 필드 자동 채움 (확인 후 저장)
                    </>
                  ),
                },
              ]}
            />
            <Row icon={<RefreshCw className="h-5 w-5" />} delay={0.06}>
              두 관리자가 같은 일정을 동시에 수정하면{' '}
              <strong>「다른 관리자가 먼저 수정했습니다」</strong> 안내가 뜹니다.{' '}
              <strong>새로고침</strong> 후 다시 저장하세요.
            </Row>
            <Row icon={<Shield className="h-5 w-5" />} delay={0.12}>
              관리자 대시보드(
              <Link href="/admin" className="font-black text-indigo-600 dark:text-indigo-400">
                /admin
              </Link>
              )에서 일정·멤버·클립·피드백을 관리할 수 있습니다.
            </Row>
          </div>
        </SectionCard>

        {/* 설정 */}
        <SectionCard
          id="settings"
          icon={<Palette className="h-6 w-6 text-violet-500 dark:text-violet-400" />}
          iconBg="bg-violet-50 dark:bg-violet-900/20"
          title="설정 · 편의 기능"
        >
          <div className="space-y-4">
            <p className="font-medium text-slate-600 dark:text-slate-300">
              상단 헤더 <strong>톱니바퀴(설정)</strong>에서 다음을 바꿀 수 있습니다.
            </p>
            <Row icon={<Palette className="h-5 w-5" />}>
              <strong>라이트 / 다크</strong> 테마
            </Row>
            <Row icon={<EyeOff className="h-5 w-5" />} delay={0.06}>
              <strong>종료된 방송 숨기기</strong>
            </Row>
            <Row icon={<History className="h-5 w-5" />} delay={0.12}>
              <strong>구버전 UI로 보기</strong> — 이전 캘린더·일정 모달 디자인
            </Row>
            <Row icon={<Megaphone className="h-5 w-5" />} delay={0.18}>
              <Link href="/announcements" className="font-black text-indigo-600 dark:text-indigo-400">
                공지사항
              </Link>
              ,{' '}
              <Link href="/calendar/monthly" className="font-black text-indigo-600 dark:text-indigo-400">
                지도동 통계
              </Link>
              ,{' '}
              <Link href="/privacy" className="font-black text-indigo-600 dark:text-indigo-400">
                개인정보처리방침
              </Link>
            </Row>
            <Row icon={<Keyboard className="h-5 w-5" />} delay={0.24}>
              열린 <strong>모달은 Esc</strong>로 닫기. 모바일 주간 뷰는 리스트형
              레이아웃.
            </Row>
            <Row icon={<Smartphone className="h-5 w-5" />} delay={0.3}>
              <strong>홈 화면에 추가</strong> — Chrome·Safari 등에서 앱처럼 설치해
              바로 열 수 있습니다.
            </Row>
          </div>
        </SectionCard>

        {/* 오류 */}
        <motion.section
          id="errors"
          {...fadeUp}
          className="rounded-4xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50"
        >
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400" />
            <h2 className="text-lg font-black text-slate-800 dark:text-white">
              페이지 오류 · 데이터가 안 맞을 때
            </h2>
          </div>
          <div className="space-y-3 text-sm font-bold leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
              오류 화면에 <strong>제보 참조 번호</strong>가 표시됩니다.{' '}
              <strong>문의 보내기</strong>로 접수하거나 <strong>제보용 텍스트 복사</strong>
              로 이메일·디스코드에 붙여 보내 주세요.
            </p>
            <p>
              일정·전적이 방금 수정한 내용과 다르면 페이지를{' '}
              <strong>새로고침</strong>해 보세요. 서버 상태는{' '}
              <Link href="/health" className="font-black text-indigo-600 dark:text-indigo-400">
                /health
              </Link>
              에서 확인할 수 있습니다.
            </p>
          </div>
        </motion.section>

        {/* 하단 */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, ease }}
          className="flex flex-col items-center gap-8 pt-8"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/calendar"
              className="inline-flex items-center gap-2 rounded-3xl bg-slate-900 px-8 py-4 font-black text-white shadow-xl shadow-slate-200 transition-colors hover:bg-slate-800 dark:bg-indigo-600 dark:shadow-indigo-900/30 dark:hover:bg-indigo-700"
            >
              캘린더로 돌아가기
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ArrowRight className="h-5 w-5" />
              </motion.span>
            </Link>
          </motion.div>
          <div className="flex flex-col items-center gap-4">
            <motion.a
              href="mailto:windowssart01@gmail.com"
              title="이메일 문의"
              className="rounded-full border border-slate-100 bg-white p-4 text-slate-400 shadow-sm transition-colors hover:text-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-600 dark:hover:text-indigo-400"
              whileHover={{ y: -4, rotate: 8, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.92 }}
            >
              <Mail className="h-5 w-5" />
            </motion.a>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">
              Map-Dyoa · 지도동 일정
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
