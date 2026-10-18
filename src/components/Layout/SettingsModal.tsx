'use client';

import {
  Sun, Moon, HelpCircle, Shield, LogIn, LogOut,
  LayoutDashboard, EyeOff, Heart, Megaphone, History, BarChart3, Server, Puzzle,
  Timer, FlaskConical, Car, MessageSquare, ChevronRight,
} from 'lucide-react';
import { CHROME_EXTENSION_NAME, CHROME_EXTENSION_URL } from '@/constants/extension';
import { useCallback, useState } from 'react';
import { Modal, Switch } from '@heroui/react';
import { useTheme } from '@teispace/next-themes';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import { usePathname } from 'next/navigation';
import { useHideEndedStreams } from '@/hooks/useHideEndedStreams';
import { useLegacyCalendarUi } from '@/hooks/useLegacyCalendarUi';
import { useCalendarBetaV3 } from '@/hooks/useCalendarBetaV3';
import { useClipWeeklyBeta } from '@/hooks/useClipWeeklyBeta';
import { SettingsFeedbackModalPresence } from '@/components/Layout/SettingsFeedback';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 px-1 text-xs font-medium text-zinc-500">{children}</h3>;
}

function SettingGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
      {children}
    </div>
  );
}

function SettingSwitch({
  isSelected,
  onChange,
  icon,
  title,
  description,
}: {
  isSelected: boolean;
  onChange: (selected: boolean) => void;
  icon: React.ReactNode;
  title: React.ReactNode;
  description?: string;
}) {
  return (
    <Switch className="w-full bg-transparent" isSelected={isSelected} onChange={onChange}>
      <Switch.Content className="!flex !w-full !flex-row !flex-nowrap !items-center !justify-between gap-4 px-3 py-2.5">
        <span className="flex min-w-0 items-center gap-2.5 text-left">
          <span className="text-zinc-400">{icon}</span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</span>
            {description ? (
              <span className="mt-0.5 block text-xs leading-snug text-zinc-500">{description}</span>
            ) : null}
          </span>
        </span>
        <Switch.Control className="shrink-0">
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );
}

function GeneralTab({
  onClose,
  isDark,
  setTheme,
  hideEnded,
  setHideEnded,
  legacyUi,
  setLegacyUi,
  calendarBetaV3,
  setCalendarBetaV3,
  clipWeeklyBeta,
  setClipWeeklyBeta,
  onOpenFeedback,
  session,
}: {
  onClose: () => void;
  isDark: boolean;
  setTheme: (t: string) => void;
  hideEnded: boolean;
  setHideEnded: (v: boolean) => void;
  legacyUi: boolean;
  setLegacyUi: (v: boolean) => void;
  calendarBetaV3: boolean;
  setCalendarBetaV3: (v: boolean) => void;
  clipWeeklyBeta: boolean;
  setClipWeeklyBeta: (v: boolean) => void;
  onOpenFeedback: () => void;
  session: ReturnType<typeof useSession>['data'];
}) {
  const router = useRouter();
  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const rowClass =
    'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-900';

  const links: { href: string; icon: React.ReactNode; label: string; hint?: string }[] = [
    { href: '/bongnudo', icon: <Car className="size-4" />, label: '봉누도 2', hint: '종료' },
    { href: '/lab/time-attack', icon: <Timer className="size-4" />, label: '호이고사', hint: 'β' },
    { href: '/lab', icon: <FlaskConical className="size-4" />, label: '실험실' },
    { href: '/announcements', icon: <Megaphone className="size-4" />, label: '공지사항' },
    { href: '/health', icon: <Server className="size-4" />, label: '백엔드 상태' },
    { href: '/calendar/monthly', icon: <BarChart3 className="size-4" />, label: '지도동 통계' },
    { href: '/help', icon: <HelpCircle className="size-4" />, label: '도움말' },
    { href: '/privacy', icon: <Shield className="size-4" />, label: '개인정보처리방침' },
  ];

  return (
    <div className="flex flex-col gap-5">
      <section>
        <SectionLabel>화면</SectionLabel>
        <SettingGroup>
          <SettingSwitch
            isSelected={isDark}
            onChange={(selected) => setTheme(selected ? 'dark' : 'light')}
            icon={isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            title={isDark ? '라이트 모드' : '다크 모드'}
            description="화면 색을 바로 바꿉니다"
          />
        </SettingGroup>
      </section>

      <section>
        <SectionLabel>관심 멤버</SectionLabel>
        <p className="px-1 text-xs leading-relaxed text-zinc-500">
          캘린더·멤버·클립 상단의 전체 / 관심 멤버로 즐겨찾기만 볼 수 있습니다. 멤버는 캘린더
          필터에서 별 아이콘으로 등록하세요.
        </p>
      </section>

      <section>
        <SectionLabel>기능</SectionLabel>
        <SettingGroup>
          <SettingSwitch
            isSelected={hideEnded}
            onChange={setHideEnded}
            icon={<EyeOff className="size-4" />}
            title="종료된 방송 숨기기"
            description="완료된 일정을 캘린더에서 숨깁니다"
          />
          <SettingSwitch
            isSelected={calendarBetaV3}
            onChange={setCalendarBetaV3}
            icon={<FlaskConical className="size-4" />}
            title={
              <>
                캘린더 v3 <BetaMark />
              </>
            }
            description="오늘 칸에 지금 방송을 제목과 합방 태그로 보여줍니다"
          />
          <SettingSwitch
            isSelected={clipWeeklyBeta}
            onChange={setClipWeeklyBeta}
            icon={<FlaskConical className="size-4" />}
            title={
              <>
                클립 위클리 <BetaMark />
              </>
            }
            description="클립 목록에서 이번 주 추천 페이지로 들어갑니다"
          />
          <SettingSwitch
            isSelected={legacyUi}
            onChange={setLegacyUi}
            icon={<History className="size-4" />}
            title="구버전 UI"
            description="이전 캘린더와 일정 모달을 사용합니다"
          />
        </SettingGroup>
      </section>

      <section>
        <SectionLabel>바로가기</SectionLabel>
        <SettingGroup>
          <button type="button" className={rowClass} onClick={onOpenFeedback}>
            <MessageSquare className="size-4 text-zinc-400" />
            <span className="min-w-0 flex-1">의견 보내기</span>
            <ChevronRight className="size-4 text-zinc-300 dark:text-zinc-600" />
          </button>
          <button
            type="button"
            className={rowClass}
            onClick={() => window.open('https://ctee.kr/place/mapdoya', '_blank', 'noopener,noreferrer')}
          >
            <Heart className="size-4 text-zinc-400" />
            <span className="min-w-0 flex-1">
              후원하기
              <span className="mt-0.5 block text-xs font-normal text-zinc-500">서버비 제외 전액 기부</span>
            </span>
            <ChevronRight className="size-4 text-zinc-300 dark:text-zinc-600" />
          </button>
          <button
            type="button"
            className={rowClass}
            onClick={() => window.open(CHROME_EXTENSION_URL, '_blank', 'noopener,noreferrer')}
          >
            <Puzzle className="size-4 text-zinc-400" />
            <span className="min-w-0 flex-1">
              멀티뷰 확장 프로그램
              <span className="mt-0.5 block text-xs font-normal text-zinc-500">{CHROME_EXTENSION_NAME}</span>
            </span>
            <ChevronRight className="size-4 text-zinc-300 dark:text-zinc-600" />
          </button>
        </SettingGroup>
      </section>

      <section>
        <SectionLabel>정보</SectionLabel>
        <SettingGroup>
          {links.map(({ href, icon, label, hint }) => (
            <button key={href} type="button" className={rowClass} onClick={() => go(href)}>
              <span className="text-zinc-400">{icon}</span>
              <span className="min-w-0 flex-1">{label}</span>
              {hint ? (
                <span className="text-xs font-normal text-zinc-400">{hint}</span>
              ) : (
                <ChevronRight className="size-4 text-zinc-300 dark:text-zinc-600" />
              )}
            </button>
          ))}
        </SettingGroup>
      </section>

      <section>
        <SectionLabel>계정</SectionLabel>
        <SettingGroup>
          {session ? (
            <>
              <div className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-zinc-500">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                관리자 로그인 중
              </div>
              <button type="button" className={rowClass} onClick={() => go('/admin')}>
                <LayoutDashboard className="size-4 text-zinc-400" />
                <span className="min-w-0 flex-1">관리자 대시보드</span>
                <ChevronRight className="size-4 text-zinc-300 dark:text-zinc-600" />
              </button>
              <button
                type="button"
                className={`${rowClass} text-red-600 dark:text-red-400`}
                onClick={() => {
                  signOut();
                  onClose();
                }}
              >
                <LogOut className="size-4" />
                <span className="min-w-0 flex-1">로그아웃</span>
              </button>
            </>
          ) : (
            <button type="button" className={rowClass} onClick={() => go('/login')}>
              <LogIn className="size-4 text-zinc-400" />
              <span className="min-w-0 flex-1">관리자 로그인</span>
              <ChevronRight className="size-4 text-zinc-300 dark:text-zinc-600" />
            </button>
          )}
        </SettingGroup>
      </section>
    </div>
  );
}

function BetaMark() {
  return (
    <span className="ml-1.5 align-middle text-[10px] font-medium uppercase tracking-wide text-zinc-400">
      Beta
    </span>
  );
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const pathname = usePathname();
  const dismiss = useModalDismiss({ mother: pathname, onClose });
  const { resolvedTheme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [hideEnded, setHideEnded] = useHideEndedStreams();
  const [legacyUi, setLegacyUi] = useLegacyCalendarUi();
  const [calendarBetaV3, setCalendarBetaV3] = useCalendarBetaV3();
  const [clipWeeklyBeta, setClipWeeklyBeta] = useClipWeeklyBeta();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const closeFeedback = useCallback(() => setFeedbackOpen(false), []);
  const isDark = resolvedTheme === 'dark';

  useEscapeKey(() => {
    if (feedbackOpen) closeFeedback();
  });

  return (
    <>
      <Modal
        isOpen={open}
        onOpenChange={(next) => {
          if (!next) dismiss();
        }}
      >
        <Modal.Backdrop isKeyboardDismissDisabled={feedbackOpen}>
          <Modal.Container placement="center" size="sm">
            <Modal.Dialog className="border border-zinc-200 shadow-xl dark:border-zinc-800">
              <Modal.Header>
                <Modal.Heading className="text-sm font-medium">설정</Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Body className="max-h-[70dvh] overflow-y-auto">
                <GeneralTab
                  onClose={dismiss}
                  isDark={isDark}
                  setTheme={setTheme}
                  hideEnded={hideEnded}
                  setHideEnded={setHideEnded}
                  legacyUi={legacyUi}
                  setLegacyUi={setLegacyUi}
                  calendarBetaV3={calendarBetaV3}
                  setCalendarBetaV3={setCalendarBetaV3}
                  clipWeeklyBeta={clipWeeklyBeta}
                  setClipWeeklyBeta={setClipWeeklyBeta}
                  onOpenFeedback={() => setFeedbackOpen(true)}
                  session={session}
                />
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
      <SettingsFeedbackModalPresence open={feedbackOpen} onClose={closeFeedback} />
    </>
  );
}
