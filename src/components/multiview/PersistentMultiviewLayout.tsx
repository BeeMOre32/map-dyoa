'use client';

import { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import type { Streamer } from '@prisma/client';
import { getPanelRows, startDrag, cumulativeTops, HANDLE_CLS, type LayoutPreset } from './utils';

type SlotStyle = { top: string; left: string; width: string; height: string };

function computeGridSlots(
  rows: Streamer[][],
  rowH: number[],
  colB: number[][],
): Map<string, SlotStyle> {
  const slots = new Map<string, SlotStyle>();
  const rowTops = cumulativeTops(rowH);
  rows.forEach((row, ri) => {
    const bounds = colB[ri] ?? [];
    const left = (ci: number) => (ci === 0 ? 0 : bounds[ci - 1]);
    const right = (ci: number) => (ci >= bounds.length ? 100 : bounds[ci]);
    row.forEach((s, ci) => {
      slots.set(s.id, {
        top: `${rowTops[ri]}%`,
        left: `${left(ci)}%`,
        width: `${right(ci) - left(ci)}%`,
        height: `${rowH[ri]}%`,
      });
    });
  });
  return slots;
}

function computeFocusSlots(
  focusedId: string,
  others: Streamer[],
  split: number,
  sideH: number[],
): Map<string, SlotStyle> {
  const slots = new Map<string, SlotStyle>();
  const sideTops = cumulativeTops(sideH);
  slots.set(focusedId, { top: '0%', left: '0%', width: `${split}%`, height: '100%' });
  others.forEach((s, i) => {
    slots.set(s.id, {
      top: `${sideTops[i]}%`,
      left: `${split}%`,
      width: `${100 - split}%`,
      height: `${sideH[i]}%`,
    });
  });
  return slots;
}

export function PersistentMultiviewLayout({
  streamers,
  focusedId,
  layoutPreset,
  renderPanel,
  initialRowH,
  initialColB,
  initialSplit,
  initialSideH,
  onGridLayoutChange,
  onFocusLayoutChange,
}: {
  streamers: Streamer[];
  focusedId: string | null;
  layoutPreset: LayoutPreset;
  renderPanel: (s: Streamer, isFocused: boolean) => React.ReactNode;
  initialRowH?: number[];
  initialColB?: number[][];
  initialSplit?: number;
  initialSideH?: number[];
  onGridLayoutChange?: (layout: { rowH: number[]; colB: number[][] }) => void;
  onFocusLayoutChange?: (layout: { split: number; sideH: number[] }) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isFocusMode = focusedId != null;

  const rows = useMemo(
    () => (isFocusMode ? [] : getPanelRows(streamers, layoutPreset)),
    [streamers, layoutPreset, isFocusMode],
  );

  /** 행·열 개수만 반영 — 스트리머 순서 변경 시 리사이즈 비율·iframe 유지 */
  const gridTopologyKey = useMemo(
    () => `${layoutPreset}|${rows.map((r) => r.length).join(',')}`,
    [layoutPreset, rows],
  );

  const others = useMemo(
    () => (focusedId ? streamers.filter((s) => s.id !== focusedId) : []),
    [streamers, focusedId],
  );
  const othersCount = others.length;

  const [rowH, setRowH] = useState<number[]>(() =>
    initialRowH?.length === rows.length ? initialRowH : rows.map(() => 100 / Math.max(rows.length, 1)),
  );
  const [colB, setColB] = useState<number[][]>(() =>
    initialColB?.length === rows.length
      ? initialColB
      : rows.map((row) =>
          Array.from({ length: Math.max(row.length - 1, 0) }, (_, i) => ((i + 1) * 100) / row.length),
        ),
  );

  const [split, setSplit] = useState(initialSplit ?? 66);
  const [sideH, setSideH] = useState<number[]>(() =>
    initialSideH?.length === others.length
      ? initialSideH
      : others.map(() => 100 / Math.max(others.length, 1)),
  );

  useEffect(() => {
    if (isFocusMode) return;
    setRowH(rows.map(() => 100 / rows.length));
    setColB(
      rows.map((row) =>
        Array.from({ length: row.length - 1 }, (_, i) => ((i + 1) * 100) / row.length),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 순서 변경만으로는 리셋하지 않음
  }, [gridTopologyKey, isFocusMode]);

  useEffect(() => {
    if (!isFocusMode || othersCount === 0) return;
    setSideH(Array.from({ length: othersCount }, () => 100 / othersCount));
  }, [othersCount, isFocusMode]);

  useEffect(() => {
    if (isFocusMode) return;
    onGridLayoutChange?.({ rowH, colB });
  }, [rowH, colB, onGridLayoutChange, isFocusMode]);

  useEffect(() => {
    if (!isFocusMode) return;
    onFocusLayoutChange?.({ split, sideH });
  }, [split, sideH, onFocusLayoutChange, isFocusMode]);

  const slots = useMemo(() => {
    if (isFocusMode && focusedId) {
      return computeFocusSlots(focusedId, others, split, sideH);
    }
    return computeGridSlots(rows, rowH, colB);
  }, [isFocusMode, focusedId, others, split, sideH, rows, rowH, colB]);

  /** 표시 순서와 무관한 DOM 순서 — 형제 노드 재배치 시 iframe이 리로드되는 것 방지 */
  const domOrderStreamers = useMemo(
    () => [...streamers].sort((a, b) => a.id.localeCompare(b.id)),
    [streamers],
  );

  const rowTops = cumulativeTops(rowH);
  const sideTops = cumulativeTops(sideH);

  return (
    <div ref={ref} className="relative flex-1 min-h-0 overflow-hidden">
      {domOrderStreamers.map((s) => {
        const slot = slots.get(s.id);
        if (!slot) return null;
        return (
          <div key={s.id} className="absolute overflow-hidden" style={slot}>
            {renderPanel(s, s.id === focusedId)}
          </div>
        );
      })}

      {!isFocusMode &&
        rows.map((row, ri) => {
          const bounds = colB[ri] ?? [];
          return (
            <Fragment key={`grid-row-${ri}`}>
              {bounds.map((bound, ci) => (
                <div
                  key={`cv-${ri}-${ci}`}
                  className={`${HANDLE_CLS} w-1 cursor-col-resize`}
                  style={{
                    top: `${rowTops[ri]}%`,
                    left: `${bound}%`,
                    height: `${rowH[ri]}%`,
                    transform: 'translateX(-50%)',
                  }}
                  onMouseDown={(e) =>
                    startDrag(e, 'x', ref, (d) =>
                      setColB((prev) => {
                        const next = prev.map((r) => [...r]);
                        const lo = ci > 0 ? next[ri][ci - 1] : 0;
                        const hi = ci + 1 < next[ri].length ? next[ri][ci + 1] : 100;
                        const nv = next[ri][ci] + d;
                        if (nv - lo < 10 || hi - nv < 10) return prev;
                        next[ri][ci] = nv;
                        return next;
                      }),
                    )
                  }
                />
              ))}

              {ri < rows.length - 1 && (
                <div
                  key={`rh-${ri}`}
                  className={`${HANDLE_CLS} left-0 right-0 h-1 cursor-row-resize`}
                  style={{ top: `${rowTops[ri] + rowH[ri]}%`, transform: 'translateY(-50%)' }}
                  onMouseDown={(e) =>
                    startDrag(e, 'y', ref, (d) =>
                      setRowH((prev) => {
                        const next = [...prev];
                        if (next[ri] + d < 10 || next[ri + 1] - d < 10) return prev;
                        next[ri] += d;
                        next[ri + 1] -= d;
                        return next;
                      }),
                    )
                  }
                />
              )}
            </Fragment>
          );
        })}

      {isFocusMode && (
        <>
          <div
            className={`${HANDLE_CLS} top-0 bottom-0 w-1 cursor-col-resize`}
            style={{ left: `${split}%`, transform: 'translateX(-50%)' }}
            onMouseDown={(e) =>
              startDrag(e, 'x', ref, (d) => setSplit((p) => Math.max(20, Math.min(80, p + d))))
            }
          />
          {others.map((_, i) =>
            i < others.length - 1 ? (
              <div
                key={`fh-${i}`}
                className={`${HANDLE_CLS} h-1 cursor-row-resize`}
                style={{
                  top: `${sideTops[i] + sideH[i]}%`,
                  left: `${split}%`,
                  width: `${100 - split}%`,
                  transform: 'translateY(-50%)',
                }}
                onMouseDown={(e) =>
                  startDrag(e, 'y', ref, (d) =>
                    setSideH((prev) => {
                      const next = [...prev];
                      if (next[i] + d < 10 || next[i + 1] - d < 10) return prev;
                      next[i] += d;
                      next[i + 1] -= d;
                      return next;
                    }),
                  )
                }
              />
            ) : null,
          )}
        </>
      )}
    </div>
  );
}
