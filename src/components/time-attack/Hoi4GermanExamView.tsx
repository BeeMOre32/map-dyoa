import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  Calendar,
  ChevronDown,
  ExternalLink,
  LayoutGrid,
  Medal,
  Sword,
  Timer,
  Users,
} from 'lucide-react';
import { HOI4_GERMAN_EXAM_2026 } from '@/config/hoi4GermanExam2026';
import type { ExamTestPhase, Hoi4GermanExamViewModel } from '@/lib/hoi4GermanExam';
import ExamEventTimer from '@/components/time-attack/ExamEventTimer';
import { cn } from '@/lib/utils';

type Props = {
  model: Hoi4GermanExamViewModel;
  testPhase?: ExamTestPhase;
  headerSlot?: ReactNode;
  leaderboardSlot?: ReactNode;
  isTestPreview?: boolean;
};

function MetaChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:border-amber-900/50 dark:bg-slate-900/80 dark:text-slate-300">
      {children}
    </span>
  );
}

function StatPills({ model }: { model: Hoi4GermanExamViewModel }) {
  const config = HOI4_GERMAN_EXAM_2026;
  const pills =
    model.phase === 'before'
      ? [
          { icon: Users, text: `참가 ${model.participantCount}명` },
          { icon: Timer, text: `출발 ${model.startTimeLabel}` },
          { icon: Sword, text: config.nation },
        ]
      : model.phase === 'live'
        ? [
            { icon: Users, text: `참가 ${model.participantCount}명` },
            { icon: Medal, text: `클리어 ${model.clearedCount}명` },
            { icon: Timer, text: `출발 ${model.startTimeLabel}` },
          ]
        : [
            { icon: Users, text: `참가 ${model.participantCount}명` },
            { icon: Medal, text: `1위 ${model.topName ?? '—'}` },
            { icon: Timer, text: model.topGameDate ?? '—' },
          ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {pills.map(({ icon: Icon, text }) => (
        <MetaChip key={text}>
          <Icon className="h-3 w-3 text-amber-500" />
          {text}
        </MetaChip>
      ))}
    </div>
  );
}

function RulesBody() {
  const config = HOI4_GERMAN_EXAM_2026;

  return (
    <div className="space-y-3">
      <ul className="space-y-1.5">
        {config.rules.map((rule) => (
          <li
            key={rule}
            className="text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300"
          >
            {rule}
          </li>
        ))}
      </ul>
      <ul className="space-y-1.5 rounded-xl bg-amber-50/80 px-3 py-3 dark:bg-amber-950/25">
        {config.stopCriteria.map((rule) => (
          <li
            key={rule}
            className="text-xs font-bold leading-relaxed text-amber-900/90 dark:text-amber-200/90"
          >
            {rule}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActionBar({
  model,
  layout = 'row',
}: {
  model: Hoi4GermanExamViewModel;
  layout?: 'row' | 'column';
}) {
  const items = [
    model.schedule
      ? {
          href: `/calendar/schedule/${model.schedule.id}`,
          icon: Calendar,
          label: '일정',
          external: false,
        }
      : null,
    model.multiviewHref
      ? {
          href: model.multiviewHref,
          icon: LayoutGrid,
          label: '멀티뷰',
          external: true,
        }
      : null,
    {
      href: '/hoi4',
      icon: Sword,
      label: '전적',
      external: false,
    },
  ].filter(Boolean) as {
    href: string;
    icon: typeof Calendar;
    label: string;
    external: boolean;
  }[];

  return (
    <div
      className={cn(
        'flex gap-2',
        layout === 'column' ? 'flex-col' : 'flex-wrap',
      )}
    >
      {items.map(({ href, icon: Icon, label, external }) => (
        <Link
          key={href}
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-xs font-black text-slate-600 transition-colors hover:border-amber-300 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-amber-800 dark:hover:text-amber-400',
            layout === 'column' ? 'w-full' : 'min-w-20 flex-1',
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
          {external ? <ExternalLink className="h-3 w-3 opacity-50" /> : null}
        </Link>
      ))}
    </div>
  );
}

export default function Hoi4GermanExamView({
  model,
  testPhase = 'auto',
  headerSlot,
  leaderboardSlot,
  isTestPreview = false,
}: Props) {
  const config = HOI4_GERMAN_EXAM_2026;

  return (
    <div className="bg-slate-50/90 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-4 pb-6 sm:px-6 sm:py-5 lg:px-8">
        {/* Hero */}
        <section className="overflow-hidden rounded-3xl border border-amber-100/90 bg-white shadow-sm dark:border-amber-900/30 dark:bg-slate-900">
          <div className="bg-linear-to-br from-amber-500/12 via-orange-400/5 to-transparent px-5 pb-4 pt-5 dark:from-amber-500/20 sm:px-6 sm:pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-[11px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-400">
                  {config.subtitle}
                </p>
                <h1 className="text-xl font-black leading-tight text-slate-900 dark:text-white sm:text-2xl lg:text-3xl">
                  {config.title}
                </h1>
                <p className="text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm">
                  {model.schedule
                    ? `${model.eventDateLabel} ${model.startTimeLabel} 일정 출발 · ${config.nation} 고정`
                    : `캘린더에 「${config.scheduleTitleIncludes.join('」「')}」 일정을 등록해 주세요`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                <div className="rounded-2xl border border-amber-200/80 bg-white/90 px-4 py-2.5 text-center dark:border-amber-800/60 dark:bg-slate-950/60">
                  <p className="text-2xl font-black tabular-nums text-amber-600 dark:text-amber-400">
                    {model.dDayLabel}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    {model.heroBadge}
                  </p>
                </div>
              </div>
            </div>
            <ExamEventTimer
              timerMode={model.timerMode}
              timerAnchorAt={model.timerAnchorAt}
              testPhase={testPhase}
            />

            {isTestPreview ? (
              <p className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-center text-[11px] font-bold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                테스트 미리보기 · 실제 화면과 다를 수 있습니다
              </p>
            ) : null}

            {headerSlot ? (
              <div className="mt-3 grid gap-2 lg:grid-cols-2 lg:items-start">{headerSlot}</div>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 border-t border-amber-100/60 px-5 py-3 dark:border-amber-900/25 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <StatPills model={model} />
            {model.schedule ? (
              <Link
                href={`/calendar/schedule/${model.schedule.id}`}
                className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-amber-700 hover:underline dark:text-amber-400"
              >
                <Calendar className="h-3 w-3" />
                {model.schedule.title}
              </Link>
            ) : null}
          </div>
        </section>

        <section className="flex min-h-[min(58vh,36rem)] flex-col rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:min-h-[min(62vh,40rem)]">
          <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">
              {model.phase === 'before' ? '참가 명단' : '랭킹'}
            </h2>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
              {model.participantCount}명
            </span>
          </div>
          <div className="min-h-0 flex-1">{leaderboardSlot}</div>
        </section>

        <ActionBar model={model} />

        <details className="group overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900 sm:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="text-sm font-black text-slate-700 dark:text-slate-200">
              진행 방식 · STOP 기준
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-slate-100 px-4 py-4 dark:border-slate-800">
            <RulesBody />
          </div>
        </details>

        <section className="hidden rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:block">
          <h2 className="mb-3 text-sm font-black text-slate-700 dark:text-slate-200">
            진행 방식 · STOP 기준
          </h2>
          <RulesBody />
        </section>
      </div>
    </div>
  );
}
