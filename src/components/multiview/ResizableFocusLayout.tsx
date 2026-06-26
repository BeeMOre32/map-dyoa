'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import type { Streamer } from '@prisma/client';
import { startDrag, cumulativeTops, HANDLE_CLS } from './utils';

export function ResizableFocusLayout({
  focused,
  others,
  renderPanel,
  initialSplit,
  initialSideH,
  onLayoutChange,
}: {
  focused: Streamer;
  others: Streamer[];
  renderPanel: (s: Streamer, isFocused: boolean) => React.ReactNode;
  initialSplit?: number;
  initialSideH?: number[];
  onLayoutChange?: (layout: { split: number; sideH: number[] }) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [split, setSplit] = useState(initialSplit ?? 66);
  const [sideH, setSideH] = useState<number[]>(() =>
    initialSideH?.length === others.length
      ? initialSideH
      : others.map(() => 100 / others.length),
  );

  const othersKey = others.map((s) => s.id).join(',');
  useEffect(() => {
    setSideH(others.map(() => 100 / others.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [othersKey]);

  useEffect(() => {
    onLayoutChange?.({ split, sideH });
  }, [split, sideH, onLayoutChange]);

  const sideTops = cumulativeTops(sideH);

  return (
    <div ref={ref} className="relative flex-1 min-h-0 overflow-hidden">
      <div
        className="absolute overflow-hidden"
        style={{ top: 0, left: 0, width: `${split}%`, height: '100%' }}
      >
        {renderPanel(focused, true)}
      </div>

      <div
        className={`${HANDLE_CLS} top-0 bottom-0 w-1 cursor-col-resize`}
        style={{ left: `${split}%`, transform: 'translateX(-50%)' }}
        onMouseDown={(e) =>
          startDrag(e, 'x', ref, (d) => setSplit((p) => Math.max(20, Math.min(80, p + d))))
        }
      />

      {others.map((s, i) => (
        <Fragment key={s.id}>
          <div
            className="absolute overflow-hidden"
            style={{
              top: `${sideTops[i]}%`,
              left: `${split}%`,
              width: `${100 - split}%`,
              height: `${sideH[i]}%`,
            }}
          >
            {renderPanel(s, false)}
          </div>
          {i < others.length - 1 && (
            <div
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
          )}
        </Fragment>
      ))}
    </div>
  );
}
