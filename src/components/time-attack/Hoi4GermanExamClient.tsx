'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Hoi4GermanExamEntry } from '@/config/hoi4GermanExam2026';
import ExamLeaderboard from '@/components/time-attack/ExamLeaderboard';
import ExamOperatePanel from '@/components/time-attack/ExamOperatePanel';
import ExamTestPanel from '@/components/time-attack/ExamTestPanel';
import Hoi4GermanExamView from '@/components/time-attack/Hoi4GermanExamView';
import type { Hoi4ExamRuntimeState } from '@/lib/hoi4-exam-state';
import {
  applyExamTestOverrides,
  patchModelWithEntries,
  patchModelWithRuntimeState,
  type ExamMemberSnapshot,
  type ExamTestPhase,
  type Hoi4GermanExamViewModel,
} from '@/lib/hoi4GermanExam';

const STORAGE_PHASE = 'hoi4-exam-test-phase';
const STORAGE_SAMPLE = 'hoi4-exam-sample-records';

type Props = {
  initialModel: Hoi4GermanExamViewModel;
  initialRuntime: Hoi4ExamRuntimeState;
  initialEntries: Hoi4GermanExamEntry[];
  /** 로그인 사용자 — 일정 관리와 동일 권한으로 출발·종료 제어 */
  canOperate: boolean;
};

function readStoredPhase(): ExamTestPhase {
  if (typeof window === 'undefined') return 'auto';
  const value = localStorage.getItem(STORAGE_PHASE);
  if (value === 'before' || value === 'live' || value === 'after' || value === 'auto') {
    return value;
  }
  return 'auto';
}

function readStoredSample(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_SAMPLE) === '1';
}

function toMemberSnapshots(model: Hoi4GermanExamViewModel): ExamMemberSnapshot[] {
  return model.rows.map((row) => ({
    streamerId: row.streamerId,
    name: row.name,
    profileImg: row.profileImg,
    colorCode: row.colorCode,
  }));
}

export default function Hoi4GermanExamClient({
  initialModel,
  initialRuntime,
  initialEntries,
  canOperate,
}: Props) {
  const members = useMemo(() => toMemberSnapshots(initialModel), [initialModel]);
  const [runtime, setRuntime] = useState(initialRuntime);
  const [entries, setEntries] = useState(initialEntries);
  const [testPhase, setTestPhase] = useState<ExamTestPhase>('auto');
  const [useSampleRecords, setUseSampleRecords] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTestPhase(readStoredPhase());
    setUseSampleRecords(readStoredSample());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_PHASE, testPhase);
  }, [hydrated, testPhase]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_SAMPLE, useSampleRecords ? '1' : '0');
  }, [hydrated, useSampleRecords]);

  useEffect(() => {
    if (testPhase !== 'auto') return;

    const poll = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch('/api/lab/hoi4-exam/sync', { cache: 'no-store' });
        if (!res.ok) return;
        const next = (await res.json()) as {
          runtime: Hoi4ExamRuntimeState;
          entries: Hoi4GermanExamEntry[];
        };
        setRuntime(next.runtime);
        setEntries(next.entries);
      } catch {
        /* ignore */
      }
    };

    const isLive =
      Boolean(runtime.manualStartedAt) && !runtime.manualEndedAt;
    const intervalMs = isLive ? 3000 : 5000;

    void poll();
    const id = window.setInterval(poll, intervalMs);

    const onVisibilityChange = () => {
      if (!document.hidden) void poll();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [testPhase, runtime.manualStartedAt, runtime.manualEndedAt]);

  const model = useMemo(() => {
    const withRuntime =
      testPhase === 'auto'
        ? patchModelWithRuntimeState(initialModel, runtime)
        : initialModel;
    const withEntries =
      testPhase === 'auto' && !useSampleRecords
        ? patchModelWithEntries(withRuntime, members, entries)
        : withRuntime;

    return applyExamTestOverrides(withEntries, members, {
      testPhase,
      useSampleRecords,
    });
  }, [initialModel, members, runtime, entries, testPhase, useSampleRecords]);

  const isTestPreview = testPhase !== 'auto' || useSampleRecords;

  const resetTest = () => {
    setTestPhase('auto');
    setUseSampleRecords(false);
  };

  const headerSlot = (
    <>
      {canOperate ? (
        <ExamOperatePanel
          variant="hero"
          phase={model.phase}
          runtime={runtime}
          onRuntimeChange={setRuntime}
        />
      ) : null}
      {process.env.NODE_ENV === 'development' ? (
        <ExamTestPanel
          testPhase={testPhase}
          useSampleRecords={useSampleRecords}
          isTestPreview={isTestPreview}
          onTestPhaseChange={setTestPhase}
          onSampleRecordsToggle={() => setUseSampleRecords((prev) => !prev)}
          onReset={resetTest}
        />
      ) : null}
    </>
  );

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain custom-scrollbar">
      <Hoi4GermanExamView
        model={model}
        testPhase={testPhase}
        headerSlot={headerSlot}
        leaderboardSlot={
          <ExamLeaderboard
            model={model}
            canOperate={canOperate}
            entries={entries}
            onEntriesChange={setEntries}
          />
        }
        isTestPreview={isTestPreview}
      />
    </div>
  );
}
