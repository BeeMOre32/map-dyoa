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
  Zap,
  Palette,
  Keyboard,
  ExternalLink,
  Clock,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Radio,
  Clapperboard,
} from 'lucide-react';
import Link from 'next/link';

/* ─── 애니메이션 프리셋 ─── */
const ease = [0.25, 0.46, 0.45, 0.94] as const;

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.55, ease },
};

const fadeLeft = {
  initial: { opacity: 0, x: -20 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.4, ease },
};

/* ─── SectionCard ─── */
function SectionCard({
  icon,
  iconBg,
  title,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      {...fadeUp}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:shadow-slate-200/60 dark:hover:shadow-black/30 transition-shadow"
    >
      <div className="flex items-center gap-4 mb-6">
        <motion.div
          className={`p-3 ${iconBg} rounded-2xl`}
          whileHover={{
            rotate: [0, -12, 12, -6, 6, 0],
            transition: { duration: 0.45 },
          }}
        >
          {icon}
        </motion.div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

/* ─── Row ─── */
function Row({
  icon,
  delay = 0,
  children,
}: {
  icon: React.ReactNode;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.p
      className="flex items-start gap-3"
      initial={{ opacity: 0, x: -14 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.38, ease, delay }}
    >
      <span className="shrink-0 mt-0.5 text-slate-400 dark:text-slate-500">{icon}</span>
      <span className="text-slate-600 dark:text-slate-300 font-medium">{children}</span>
    </motion.p>
  );
}

/* ─── NewBadge ─── */
function NewBadge() {
  return (
    <motion.span
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.3 }}
      className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500 text-white uppercase tracking-wider"
    >
      new
    </motion.span>
  );
}

/* ─── LiveBadgeDemo ─── */
function LiveBadgeDemo() {
  return (
    <span className="inline-flex items-center gap-1 align-middle mx-1 px-2 py-0.5 bg-red-50 dark:bg-red-900/20 rounded-full">
      <span className="relative flex w-1.5 h-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-red-500" />
      </span>
      <span className="text-[9px] font-black text-red-500 uppercase tracking-wide">live</span>
    </span>
  );
}

/* ─── Tip ─── */
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      {...fadeLeft}
      transition={{ duration: 0.4, ease, delay: 0.15 }}
      className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-800/40 flex items-start gap-3 mt-4"
    >
      <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
      <span className="text-sm font-bold text-amber-800 dark:text-amber-300">{children}</span>
    </motion.div>
  );
}

export default function GuidePage() {
  return (
    <div className="h-screen w-full overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-950 py-12 px-4 sm:px-6 transition-colors">
      <div className="max-w-3xl mx-auto space-y-6 pb-12">

        {/* ── 헤더 ── */}
        <div className="text-center space-y-3 mb-10">
          {/* 떠다니는 아이콘 */}
          <motion.div
            className="inline-flex items-center justify-center p-4 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-3xl mb-2 shadow-sm"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <BookOpen className="w-10 h-10" />
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight"
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
            스트리머 합방 캘린더와 클립 모음을 100% 활용하는 방법
          </motion.p>
        </div>

        {/* ── 1. 캘린더 뷰 ── */}
        <SectionCard
          icon={<CalendarDays className="w-6 h-6 text-blue-500 dark:text-blue-400" />}
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          title="1. 캘린더 뷰 전환"
        >
          <div className="space-y-4">
            <Row icon={<LayoutGrid className="w-5 h-5" />} delay={0}>
              우측 상단의 <strong>주간 / 월간</strong> 버튼으로 캘린더 보기 방식을 전환할 수 있습니다.
            </Row>
            <Row icon={<ChevronLeft className="w-5 h-5" />} delay={0.07}>
              <strong>← →</strong> 화살표로 이전/다음 주·월로 이동합니다.
            </Row>
            <Row icon={<MousePointerClick className="w-5 h-5" />} delay={0.14}>
              날짜 셀을 클릭하면 해당 날의 <strong>일정 목록 모달</strong>이 열립니다.
            </Row>
            <Tip>
              주간 뷰는 일정 카드를 더 넓게 보여주고, 월간 뷰는 한 달 흐름을 한눈에 볼 때 유용합니다.
            </Tip>
          </div>
        </SectionCard>

        {/* ── 2. 스트리머 필터 ── */}
        <SectionCard
          icon={<SlidersHorizontal className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />}
          iconBg="bg-indigo-50 dark:bg-indigo-900/20"
          title={<>2. 스트리머 필터<NewBadge /></>}
        >
          <div className="space-y-4">
            <Row icon={<SlidersHorizontal className="w-5 h-5" />} delay={0}>
              좌측 상단 <strong>설정 버튼</strong>을 누르면 슬라이드 드로어가 열립니다.
              스트리머 필터 섹션을 클릭해 펼치면 원하는 스트리머만 선택해 일정을 필터링할 수 있습니다.
            </Row>
            <Row icon={<Search className="w-5 h-5" />} delay={0.07}>
              검색창에서 <strong>이름 또는 초성</strong>으로 스트리머를 빠르게 찾을 수 있습니다.{' '}
              <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-black">ㄷㅁ</code>{' '}
              → 두뭉,{' '}
              <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-black">ㅎㅇ</code>{' '}
              → 허인
            </Row>
            <Row icon={<Users className="w-5 h-5" />} delay={0.14}>
              스트리머를 선택하면 해당 인원의 일정만 캘린더에 표시됩니다.
              선택된 수는 <strong>배지</strong>로 확인할 수 있으며 '초기화'로 한 번에 해제됩니다.
            </Row>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, ease, delay: 0.2 }}
              className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/40 mt-2"
            >
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="shrink-0 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700"
              >
                <SlidersHorizontal className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              </motion.div>
              <span className="text-sm font-bold text-indigo-800 dark:text-indigo-300">
                모바일에서는 드로어가 <strong>전체 화면</strong>으로 펼쳐집니다.
              </span>
            </motion.div>
          </div>
        </SectionCard>

        {/* ── 3. 라이브 뱃지 ── */}
        <SectionCard
          icon={<Radio className="w-6 h-6 text-red-500 dark:text-red-400" />}
          iconBg="bg-red-50 dark:bg-red-900/20"
          title={<>3. 라이브 뱃지<NewBadge /></>}
        >
          <div className="space-y-4">
            <Row icon={<Radio className="w-5 h-5" />} delay={0}>
              오늘 일정에 참여하는 스트리머가 치지직에서 <strong>현재 방송 중</strong>이면
              일정 카드에 <LiveBadgeDemo /> 뱃지가 자동으로 표시됩니다.
            </Row>
            <Row icon={<Clock className="w-5 h-5" />} delay={0.07}>
              라이브 상태는 <strong>60초마다</strong> 자동으로 갱신됩니다. 페이지를 새로고침하지 않아도 됩니다.
            </Row>
            <Row icon={<CalendarDays className="w-5 h-5" />} delay={0.14}>
              뱃지는 <strong>오늘 날짜 일정에만</strong> 표시됩니다. 과거·미래 일정에는 나타나지 않습니다.
            </Row>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, ease, delay: 0.2 }}
              className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-800/40"
            >
              <LiveBadgeDemo />
              <span className="text-sm font-bold text-red-800 dark:text-red-300">
                뱃지가 보인다면 지금 바로 방송 중이에요!
              </span>
            </motion.div>
          </div>
        </SectionCard>

        {/* ── 4. 색상 의미 ── */}
        <SectionCard
          icon={<Palette className="w-6 h-6 text-violet-500 dark:text-violet-400" />}
          iconBg="bg-violet-50 dark:bg-violet-900/20"
          title="4. 일정 카드 색상의 의미"
        >
          <div className="space-y-4">
            <Row icon={<Gamepad2 className="w-5 h-5" />} delay={0}>
              <strong>게임 콘텐츠</strong> 일정은 해당 게임의 고유 컬러로 배경이 채워집니다.
            </Row>
            <Row icon={<Users className="w-5 h-5" />} delay={0.07}>
              일정 카드 하단의 <strong>참여자 배지</strong>는 각 스트리머의 고유 색상으로 표시됩니다.
            </Row>
            <Row icon={<Zap className="w-5 h-5" />} delay={0.14}>
              <strong>시간 미정</strong> 배지가 붙은 일정은 방송 시작 시간이 정해지지 않은 게릴라성 일정입니다.
            </Row>
            <Tip>
              다크 모드에서는 컬러가 자동으로 밝은 버전으로 전환되어 가독성을 유지합니다.
            </Tip>
          </div>
        </SectionCard>

        {/* ── 3. 일정 상세 ── */}
        <SectionCard
          icon={<MousePointerClick className="w-6 h-6 text-sky-500 dark:text-sky-400" />}
          iconBg="bg-sky-50 dark:bg-sky-900/20"
          title="5. 일정 상세 보기"
        >
          <div className="space-y-4">
            <Row icon={<Clock className="w-5 h-5" />} delay={0}>
              일정 카드를 클릭하면 <strong>시작/종료 시간, 게임, 내용</strong>을 확인할 수 있는 상세 모달이 열립니다.
            </Row>
            <Row icon={<Users className="w-5 h-5" />} delay={0.07}>
              참여 스트리머 이름을 클릭하면 해당 <strong>스트리머 프로필 페이지</strong>로 이동합니다.
            </Row>
            <Row icon={<ExternalLink className="w-5 h-5" />} delay={0.14}>
              방송 링크가 등록된 경우 <strong>CHZZK / YouTube 다시보기</strong> 버튼이 표시됩니다.
            </Row>
          </div>
        </SectionCard>

        {/* ── 4. 스트리머 페이지 ── */}
        <SectionCard
          icon={<Users className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />}
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          title="6. 스트리머 페이지"
        >
          <div className="space-y-4">
            <Row icon={<Users className="w-5 h-5" />} delay={0}>
              상단 탭의 <strong>스트리머</strong>에서 등록된 모든 스트리머를 카드 형태로 확인할 수 있습니다.
            </Row>
            <Row icon={<Search className="w-5 h-5" />} delay={0.07}>
              일정 등록 시 스트리머 선택 창에서 이름으로 검색할 수 있으며,{' '}
              <strong>한글 초성 검색</strong>도 지원합니다.{' '}
              <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-black">
                ㄷㅁ
              </code>{' '}
              → 두뭉
            </Row>
            <Row icon={<MousePointerClick className="w-5 h-5" />} delay={0.14}>
              스트리머 카드를 클릭하면 <strong>프로필 모달</strong>에서 기수, 역할, 플랫폼 정보를 볼 수 있습니다.
            </Row>
            <Tip>
              정보에 오류가 있으면 카드 우측 상단 ⋯ 버튼 → '정보 수정 요청'으로 제보해주세요.
            </Tip>
          </div>
        </SectionCard>

        {/* ── 클립 모음 ── */}
        <SectionCard
          icon={<Clapperboard className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />}
          iconBg="bg-indigo-50 dark:bg-indigo-900/20"
          title={<>7. 클립 모음<NewBadge /></>}
        >
          <div className="space-y-4">
            <Row icon={<Clapperboard className="w-5 h-5" />} delay={0}>
              방송에서 나온 <strong>인상적인 순간을 클립</strong>으로 아카이빙합니다.
              치지직 클립 URL을 붙여넣으면 <strong>썸네일·제목이 자동 추출</strong>됩니다.
            </Row>
            <Row icon={<SlidersHorizontal className="w-5 h-5" />} delay={0.07}>
              상단 드롭다운으로 <strong>스트리머별 필터링</strong>이 가능합니다.
              원하는 스트리머의 클립만 골라볼 수 있습니다.
            </Row>
            <Row icon={<ExternalLink className="w-5 h-5" />} delay={0.14}>
              카드의 <strong>외부 링크 버튼</strong>으로 원본 클립 페이지로 이동하거나,
              치지직 클립이라면 카드에서 <strong>바로 인라인 재생</strong>도 가능합니다.
            </Row>
            <div className="grid sm:grid-cols-3 gap-4 pt-1">
              {[
                {
                  icon: <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />,
                  label: '클립 추가',
                  desc: (
                    <>
                      로그인 후 <strong>+ 클립 추가</strong> 버튼을 누릅니다.
                      치지직 URL 입력 시 썸네일·제목이 자동 완성되며, 연관 스트리머와 방송 일정도 연결할 수 있습니다.
                    </>
                  ),
                  delay: 0,
                },
                {
                  icon: <Edit2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />,
                  label: '클립 수정',
                  desc: (
                    <>
                      카드의 <strong>연필 버튼</strong>을 누르면 제목, 스트리머, 방송, 날짜, 설명을 수정할 수 있습니다.
                    </>
                  ),
                  delay: 0.07,
                },
                {
                  icon: <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />,
                  label: '클립 삭제',
                  desc: (
                    <>
                      카드의 <strong>휴지통 버튼</strong>으로 삭제합니다. 삭제 후 복구 불가.
                    </>
                  ),
                  delay: 0.14,
                },
              ].map(({ icon, label, desc, delay }) => (
                <motion.div
                  key={label}
                  className="p-5 bg-slate-50 dark:bg-slate-700 rounded-3xl border border-slate-100 dark:border-slate-600"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, ease, delay }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
                >
                  <div className="flex items-center gap-2 mb-2 text-slate-800 dark:text-white font-black text-sm">
                    {icon}
                    {label}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    {desc}
                  </p>
                </motion.div>
              ))}
            </div>
            <Tip>
              치지직 클립 URL 입력 시 썸네일·제목이 자동 추출됩니다. 추출에 실패하면 직접 입력하세요.
            </Tip>
          </div>
        </SectionCard>

        {/* ── 로그인 ── */}
        <SectionCard
          icon={<LogIn className="w-6 h-6 text-amber-500 dark:text-amber-400" />}
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          title="8. 로그인과 편집 권한"
        >
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-300 font-medium">
              구글 계정으로 <strong>로그인한 사용자라면 누구나</strong> 캘린더에 기여할 수 있습니다.
            </p>
            <Tip>
              로그인 후에는 숨겨져 있던 '일정 추가', '수정', '삭제' 버튼이 나타납니다.
            </Tip>
          </div>
        </SectionCard>

        {/* ── 6. CRUD ── */}
        <SectionCard
          icon={<Edit2 className="w-6 h-6 text-rose-500 dark:text-rose-400" />}
          iconBg="bg-rose-50 dark:bg-rose-900/20"
          title="9. 일정 추가 · 수정 · 삭제"
        >
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />,
                label: '일정 추가',
                desc: (
                  <>
                    우측 상단 <strong>+ 일정 추가</strong> 버튼으로 제목, 날짜, 시간, 참여자, 게임을 입력합니다.
                    시간이 미정인 경우 <strong>'시간 미정'</strong> 체크박스를 활성화하세요.
                  </>
                ),
                delay: 0,
              },
              {
                icon: <Edit2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />,
                label: '내용 수정',
                desc: (
                  <>
                    상세 모달에서 <strong>수정 버튼</strong>을 누르면 화면 이동 없이 그 자리에서 바로 내용을 변경합니다.
                  </>
                ),
                delay: 0.07,
              },
              {
                icon: <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />,
                label: '삭제',
                desc: (
                  <>
                    취소되거나 잘못 등록된 일정은 <strong>휴지통 버튼</strong>으로 삭제할 수 있습니다.{' '}
                    삭제 후 복구 불가.
                  </>
                ),
                delay: 0.14,
              },
            ].map(({ icon, label, desc, delay }) => (
              <motion.div
                key={label}
                className="p-5 bg-slate-50 dark:bg-slate-700 rounded-3xl border border-slate-100 dark:border-slate-600"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, ease, delay }}
                whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
              >
                <div className="flex items-center gap-2 mb-2 text-slate-800 dark:text-white font-black text-sm">
                  {icon}
                  {label}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  {desc}
                </p>
              </motion.div>
            ))}
          </div>
        </SectionCard>

        {/* ── 7. 편의 기능 ── */}
        <SectionCard
          icon={<Keyboard className="w-6 h-6 text-slate-500 dark:text-slate-400" />}
          iconBg="bg-slate-100 dark:bg-slate-700"
          title="10. 편의 기능"
        >
          <div className="space-y-4">
            <Row icon={<Keyboard className="w-5 h-5" />} delay={0}>
              열려 있는 <strong>모달은 Esc 키</strong>로 닫을 수 있습니다.
            </Row>
            <Row icon={<Palette className="w-5 h-5" />} delay={0.07}>
              우측 상단 <strong>라이트/다크 모드</strong> 토글로 테마를 전환합니다.
              스트리머·게임 색상도 모드에 맞게 자동 조정됩니다.
            </Row>
            <Row icon={<ChevronRight className="w-5 h-5" />} delay={0.14}>
              모바일에서는 주간 뷰가 <strong>리스트 형식</strong>으로 표시되어 일정을 더 편하게 확인할 수 있습니다.
            </Row>
          </div>
        </SectionCard>

        {/* ── 하단 ── */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, ease }}
          className="pt-8 flex flex-col items-center gap-8"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/calendar"
              className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-3xl font-black hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors shadow-xl shadow-slate-200 dark:shadow-indigo-900/30"
            >
              캘린더로 돌아가기
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.span>
            </Link>
          </motion.div>

          <div className="flex flex-col items-center gap-4">
            <motion.a
              href="mailto:windowssart01@gmail.com"
              title="Send Email"
              className="p-4 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 transition-colors hover:text-indigo-500 dark:hover:text-indigo-400"
              whileHover={{ y: -4, rotate: 8, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.92 }}
            >
              <Mail className="w-5 h-5" />
            </motion.a>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-600 tracking-widest uppercase">
              Created by someone who loves map
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
