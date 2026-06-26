'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import type { Streamer } from '@prisma/client';
import { startDrag, cumulativeTops, HANDLE_CLS } from './utils';

export function ResizableGrid({
  rows,
  renderPanel,
  initialRowH,
  initialColB,
  onLayoutChange,
}: {
  rows: Streamer[][];
  renderPanel: (s: Streamer) => React.ReactNode;
  initialRowH?: number[];
  initialColB?: number[][];
  onLayoutChange?: (layout: { rowH: number[]; colB: number[][] }) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rowKey = rows.map((r) => r.map((s) => s.id).join(',')).join('|');

  const [rowH, setRowH] = useState<number[]>(() =>
    initialRowH?.length === rows.length
      ? initialRowH
      : rows.map(() => 100 / rows.length),
  );
  const [colB, setColB] = useState<number[][]>(() =>
    initialColB?.length === rows.length
      ? initialColB
      : rows.map((row) =>
          Array.from({ length: row.length - 1 }, (_, i) => ((i + 1) * 100) / row.length),
        ),
  );

  useEffect(() => {
    setRowH(rows.map(() => 100 / rows.length));
    setColB(
      rows.map((row) =>
        Array.from({ length: row.length - 1 }, (_, i) => ((i + 1) * 100) / row.length),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowKey]);

  useEffect(() => {
    onLayoutChange?.({ rowH, colB });
  }, [rowH, colB, onLayoutChange]);

  const rowTops = cumulativeTops(rowH);

  return (
    <div ref={ref} className="relative flex-1 min-h-0 overflow-hidden">
      {rows.map((row, ri) => {
        const bounds = colB[ri] ?? [];
        const left = (ci: number) => (ci === 0 ? 0 : bounds[ci - 1]);
        const right = (ci: number) => (ci >= bounds.length ? 100 : bounds[ci]);

        return (
          <Fragment key={ri}>
            {row.map((s, ci) => (
              <div
                key={s.id}
                className="absolute overflow-hidden"
                style={{
                  top: `${rowTops[ri]}%`,
                  left: `${left(ci)}%`,
                  width: `${right(ci) - left(ci)}%`,
                  height: `${rowH[ri]}%`,
                }}
              >
                {renderPanel(s)}
              </div>
            ))}

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
    </div>
  );
}
