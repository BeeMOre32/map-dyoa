import { auth } from '@/auth';
import Hoi4GermanExamClient from '@/components/time-attack/Hoi4GermanExamClient';
import { HOI4_GERMAN_EXAM_2026 } from '@/config/hoi4GermanExam2026';
import { getCalendarData } from '@/lib/data-fetching';
import {
  loadHoi4ExamEntriesForBinding,
  loadHoi4ExamRuntimeForBinding,
} from '@/lib/hoi4-exam-load';
import {
  buildHoi4GermanExamViewModel,
  resolveHoi4GermanExamBinding,
} from '@/lib/hoi4GermanExam';
import { buildPageMetadata } from '@/lib/site';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'HOI4 독일 호이고사',
  description:
    '제1회 공식 지도동 대회 HOI4 독일 호이고사 — 소련 STOP 타임어택 실시간 랭킹',
  path: '/lab/time-attack',
  noIndex: true,
});

export default async function TimeAttackPage() {
  const { schedules } = await getCalendarData();
  const binding = resolveHoi4GermanExamBinding(schedules, HOI4_GERMAN_EXAM_2026);
  const [runtime, entries, session] = await Promise.all([
    loadHoi4ExamRuntimeForBinding(binding),
    loadHoi4ExamEntriesForBinding(binding),
    auth(),
  ]);
  const model = buildHoi4GermanExamViewModel({
    config: HOI4_GERMAN_EXAM_2026,
    binding,
    runtime,
    entries,
  });
  const canOperate = Boolean(session);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="sr-only">
        <h1>{HOI4_GERMAN_EXAM_2026.title}</h1>
        <p>{HOI4_GERMAN_EXAM_2026.subtitle}</p>
      </header>
      <Hoi4GermanExamClient
        initialModel={model}
        initialRuntime={runtime}
        initialEntries={entries}
        canOperate={canOperate}
      />
    </div>
  );
}
