'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ExternalLink, LayoutGrid, FlaskConical, X,
  PlayCircle, ChevronLeft, ChevronRight, Maximize2, Minimize2, Play, Plus, Check, Puzzle, MessageSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { getStreamerColor } from '@/constants/streamercolor';
import type { Streamer } from '@prisma/client';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';

const MAX_STREAMS = 9;

interface MultiViewProps {
  schedule: FlattenedSchedule;
}

function getLiveUrl(streamer: Streamer): string {
  const base = streamer.chzzkUrl ?? `https://chzzk.naver.com/${streamer.handle}`;
  try {
    const { pathname } = new URL(base);
    const segments = pathname.split('/').filter(Boolean);
    const channelId = segments[segments.length - 1];
    if (channelId && channelId !== 'live') {
      return `https://chzzk.naver.com/live/${channelId}`;
    }
  } catch {
    // URL 파싱 실패 시 원본 사용
  }
  return base;
}

function getChatUrl(streamer: Streamer): string {
  return `${getLiveUrl(streamer)}/chat`;
}

function getPanelRows<T>(panels: T[]): T[][] {
  const n = panels.length;
  if (n <= 2) return [panels];
  if (n === 9) return [panels.slice(0, 3), panels.slice(3, 6), panels.slice(6)];
  const half = Math.ceil(n / 2);
  return [panels.slice(0, half), panels.slice(half)];
}

function startDrag(
  e: React.MouseEvent,
  axis: 'x' | 'y',
  containerRef: React.RefObject<HTMLDivElement | null>,
  onDelta: (pct: number) => void,
) {
  e.preventDefault();
  document.body.classList.add('is-resizing');
  let prev = axis === 'x' ? e.clientX : e.clientY;
  const onMove = (ev: MouseEvent) => {
    const cur = axis === 'x' ? ev.clientX : ev.clientY;
    const size = axis === 'x'
      ? (containerRef.current?.offsetWidth ?? 1)
      : (containerRef.current?.offsetHeight ?? 1);
    onDelta((cur - prev) / size * 100);
    prev = cur;
  };
  const onUp = () => {
    document.body.classList.remove('is-resizing');
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

// ── 그리드 리사이즈 레이아웃 ───────────────────────────────
function ResizableGrid({
  rows,
  renderPanel,
}: {
  rows: Streamer[][];
  renderPanel: (s: Streamer) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rowKey = rows.map(r => r.map(s => s.id).join(',')).join('|');

  const [rowH, setRowH] = useState<number[]>(() => rows.map(() => 100 / rows.length));
  const [colB, setColB] = useState<number[][]>(() =>
    rows.map(row => Array.from({ length: row.length - 1 }, (_, i) => (i + 1) * 100 / row.length))
  );

  useEffect(() => {
    setRowH(rows.map(() => 100 / rows.length));
    setColB(rows.map(row => Array.from({ length: row.length - 1 }, (_, i) => (i + 1) * 100 / row.length)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowKey]);

  const rowTops: number[] = [];
  let cumH = 0;
  for (const h of rowH) { rowTops.push(cumH); cumH += h; }

  const HANDLE = 'absolute z-20 bg-slate-900 hover:bg-indigo-500/60 transition-colors';

  return (
    <div ref={ref} className="relative flex-1 min-h-0 overflow-hidden">
      {rows.map((row, ri) => {
        const bounds = colB[ri] ?? [];
        const left = (ci: number) => ci === 0 ? 0 : bounds[ci - 1];
        const right = (ci: number) => ci >= bounds.length ? 100 : bounds[ci];

        return (
          <Fragment key={ri}>
            {row.map((s, ci) => (
              <div
                key={s.id}
                className="absolute overflow-hidden"
                style={{ top: `${rowTops[ri]}%`, left: `${left(ci)}%`, width: `${right(ci) - left(ci)}%`, height: `${rowH[ri]}%` }}
              >
                {renderPanel(s)}
              </div>
            ))}

            {bounds.map((bound, ci) => (
              <div
                key={`cv-${ri}-${ci}`}
                className={`${HANDLE} w-1 cursor-col-resize`}
                style={{ top: `${rowTops[ri]}%`, left: `${bound}%`, height: `${rowH[ri]}%`, transform: 'translateX(-50%)' }}
                onMouseDown={(e) => startDrag(e, 'x', ref, (d) => setColB(prev => {
                  const next = prev.map(r => [...r]);
                  const lo = ci > 0 ? next[ri][ci - 1] : 0;
                  const hi = ci + 1 < next[ri].length ? next[ri][ci + 1] : 100;
                  const nv = next[ri][ci] + d;
                  if (nv - lo < 10 || hi - nv < 10) return prev;
                  next[ri][ci] = nv;
                  return next;
                }))}
              />
            ))}

            {ri < rows.length - 1 && (
              <div
                key={`rh-${ri}`}
                className={`${HANDLE} left-0 right-0 h-1 cursor-row-resize`}
                style={{ top: `${rowTops[ri] + rowH[ri]}%`, transform: 'translateY(-50%)' }}
                onMouseDown={(e) => startDrag(e, 'y', ref, (d) => setRowH(prev => {
                  const next = [...prev];
                  if (next[ri] + d < 10 || next[ri + 1] - d < 10) return prev;
                  next[ri] += d; next[ri + 1] -= d;
                  return next;
                }))}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

// ── 포커스 리사이즈 레이아웃 ───────────────────────────────
function ResizableFocusLayout({
  focused,
  others,
  renderPanel,
}: {
  focused: Streamer;
  others: Streamer[];
  renderPanel: (s: Streamer, isFocused: boolean) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [split, setSplit] = useState(66);
  const [sideH, setSideH] = useState<number[]>(() => others.map(() => 100 / others.length));

  useEffect(() => {
    setSideH(others.map(() => 100 / others.length));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [others.map(s => s.id).join(',')]);

  const sideTops: number[] = [];
  let cumH = 0;
  for (const h of sideH) { sideTops.push(cumH); cumH += h; }

  const HANDLE = 'absolute z-20 bg-slate-900 hover:bg-indigo-500/60 transition-colors';

  return (
    <div ref={ref} className="relative flex-1 min-h-0 overflow-hidden">
      <div className="absolute overflow-hidden" style={{ top: 0, left: 0, width: `${split}%`, height: '100%' }}>
        {renderPanel(focused, true)}
      </div>

      <div
        className={`${HANDLE} top-0 bottom-0 w-1 cursor-col-resize`}
        style={{ left: `${split}%`, transform: 'translateX(-50%)' }}
        onMouseDown={(e) => startDrag(e, 'x', ref, (d) => setSplit(p => Math.max(20, Math.min(80, p + d))))}
      />

      {others.map((s, i) => (
        <Fragment key={s.id}>
          <div
            className="absolute overflow-hidden"
            style={{ top: `${sideTops[i]}%`, left: `${split}%`, width: `${100 - split}%`, height: `${sideH[i]}%` }}
          >
            {renderPanel(s, false)}
          </div>
          {i < others.length - 1 && (
            <div
              className={`${HANDLE} h-1 cursor-row-resize`}
              style={{ top: `${sideTops[i] + sideH[i]}%`, left: `${split}%`, width: `${100 - split}%`, transform: 'translateY(-50%)' }}
              onMouseDown={(e) => startDrag(e, 'y', ref, (d) => setSideH(prev => {
                const next = [...prev];
                if (next[i] + d < 10 || next[i + 1] - d < 10) return prev;
                next[i] += d; next[i + 1] -= d;
                return next;
              }))}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}

// ── 선택 화면 ──────────────────────────────────────────────
function SelectionScreen({
  schedule, participants, isDark, onStart,
}: {
  schedule: FlattenedSchedule;
  participants: Streamer[];
  isDark: boolean;
  onStart: (ids: string[]) => void;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(
    participants.slice(0, MAX_STREAMS).map((p) => p.id),
  );

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < MAX_STREAMS
          ? [...prev, id]
          : prev,
    );
  };

  const selectAll = () => setSelected(participants.slice(0, MAX_STREAMS).map((p) => p.id));
  const clearAll = () => setSelected([]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl"
      >
        {/* 헤더 */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-indigo-400 shrink-0" />
            <h2 className="text-lg font-black text-white">멀티뷰 시청</h2>
          </div>
          <p className="text-sm text-slate-400 font-medium truncate pl-7">{schedule.title}</p>
          <p className="text-xs text-slate-600 font-medium pl-7">
            시청할 스트리머를 선택하세요 · 최대 {MAX_STREAMS}명
          </p>
        </div>

        {/* 아바타 그리드 */}
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {participants.map((s) => {
            const color = getStreamerColor(s.id, isDark) ?? s.colorCode;
            const isSelected = selected.includes(s.id);
            const isDisabled = !isSelected && selected.length >= MAX_STREAMS;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                disabled={isDisabled}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors ${
                  isDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-800'
                }`}
              >
                <div
                  className="relative w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-base shrink-0 transition-all duration-200"
                  style={{
                    backgroundColor: color,
                    boxShadow: isSelected ? `0 0 0 2px #0f172a, 0 0 0 4px ${color}` : 'none',
                  }}
                >
                  {s.profileImg ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.profileImg} alt={s.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    s.name[0]
                  )}
                  {isSelected && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span className={`text-[11px] font-bold text-center line-clamp-1 w-full transition-colors ${
                  isSelected ? 'text-white' : 'text-slate-500'
                }`}>
                  {s.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* 확장 프로그램 안내 */}
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <Puzzle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-300/80 font-medium leading-relaxed">
            <span className="font-black text-amber-400">채팅 기능</span>을 사용하려면{' '}
            <span className="font-black text-amber-400">확장 프로그램</span> 설치가 필요합니다.{' '}
            <code className="bg-amber-900/40 px-1 rounded text-amber-300 font-mono text-[10px]">chrome://extensions</code>{' '}
            → 개발자 모드 → 압축 해제된 확장 프로그램 로드 →{' '}
            <code className="bg-amber-900/40 px-1 rounded text-amber-300 font-mono text-[10px]">/extension</code> 폴더 선택
          </div>
        </div>

        {/* 카운터 + 전체 선택/해제 */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-500">
              <span className="text-white font-black">{selected.length}</span>명 선택
            </span>
            {selected.length >= MAX_STREAMS && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                최대
              </span>
            )}
            <button
              onClick={selected.length === participants.length ? clearAll : selectAll}
              className="text-[11px] font-black text-slate-600 hover:text-slate-400 transition-colors"
            >
              {selected.length > 0 ? '전체 해제' : '전체 선택'}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-2xl border border-slate-700 text-slate-400 text-sm font-black hover:bg-slate-800 transition-colors"
            >
              취소
            </button>
            <button
              onClick={() => selected.length > 0 && onStart(selected)}
              disabled={selected.length === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/40"
            >
              <Play className="w-4 h-4" />
              시청 시작
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── 채팅 패널 ──────────────────────────────────────────────
function ChatPanel({
  streamers,
  chatStreamerId,
  onClose,
  onSwitch,
}: {
  streamers: Streamer[];
  chatStreamerId: string;
  onClose: () => void;
  onSwitch: (id: string) => void;
}) {
  const [width, setWidth] = useState(320);
  const chatStreamer = streamers.find((s) => s.id === chatStreamerId);
  if (!chatStreamer) return null;

  return (
    <div className="relative flex shrink-0" style={{ width }}>
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10 bg-slate-800 hover:bg-indigo-500/60 transition-colors"
        onMouseDown={(e) => {
          e.preventDefault();
          const startX = e.clientX;
          const startW = width;
          const onMove = (ev: MouseEvent) => {
            setWidth(Math.max(200, Math.min(600, startW - (ev.clientX - startX))));
          };
          const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
          };
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        }}
      />
      <div className="flex-1 flex flex-col bg-slate-950 border-l border-slate-800 overflow-hidden pl-1">
        <div className="shrink-0 flex items-center gap-2 px-3 h-10 bg-slate-900 border-b border-slate-800">
          <MessageSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <select
            value={chatStreamerId}
            onChange={(e) => onSwitch(e.target.value)}
            className="flex-1 bg-transparent text-white text-xs font-black outline-none min-w-0 cursor-pointer"
          >
            {streamers.map((s) => (
              <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                {s.name}
              </option>
            ))}
          </select>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <iframe
          key={chatStreamerId}
          src={getChatUrl(chatStreamer)}
          className="flex-1 border-none"
          title={`${chatStreamer.name} 채팅`}
        />
      </div>
    </div>
  );
}

// ── 스트림 패널 ────────────────────────────────────────────
function StreamPanel({
  streamer, color, isLoaded, isFocused, canLeft, canRight,
  onLoad, onHide, onFocus, onUnfocus, onSwapLeft, onSwapRight, onOpenChat,
}: {
  streamer: Streamer; color: string;
  isLoaded: boolean; isFocused: boolean; canLeft: boolean; canRight: boolean;
  onLoad: () => void; onHide: () => void;
  onFocus: () => void; onUnfocus: () => void;
  onSwapLeft: () => void; onSwapRight: () => void;
  onOpenChat: () => void;
}) {
  const liveUrl = getLiveUrl(streamer);

  return (
    <div className="relative bg-slate-950 overflow-hidden group/panel h-full">
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer"
            style={{ background: `linear-gradient(135deg, ${color}22, ${color}0a)` }}
            onClick={onLoad}
          >
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-black text-white shadow-lg"
              style={{ backgroundColor: color, boxShadow: `0 8px 32px ${color}50` }}
            >
              {streamer.name[0]}
            </div>
            <p className="text-white font-black text-base">{streamer.name}</p>
            <motion.div
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white text-sm font-black shadow-md"
              style={{ backgroundColor: color }}
            >
              <PlayCircle className="w-4 h-4" />
              시청 시작
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoaded && (
        <iframe
          src={liveUrl}
          className="w-full h-full border-none"
          allow="autoplay; fullscreen; picture-in-picture"
          title={streamer.name}
        />
      )}

      {/* 컨트롤 오버레이 */}
      <div className="absolute top-0 left-0 right-0 flex items-center gap-1 px-2 py-2 bg-linear-to-b from-black/75 to-transparent opacity-0 group-hover/panel:opacity-100 transition-opacity duration-200">
        <button onClick={onSwapLeft} disabled={!canLeft}
          className="p-1 rounded hover:bg-white/20 text-white/70 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={onSwapRight} disabled={!canRight}
          className="p-1 rounded hover:bg-white/20 text-white/70 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed">
          <ChevronRight className="w-4 h-4" />
        </button>
        <span className="w-2 h-2 rounded-full shrink-0 ml-0.5" style={{ backgroundColor: color }} />
        <span className="text-white text-xs font-black flex-1 truncate mx-1">{streamer.name}</span>
        <button onClick={isFocused ? onUnfocus : onFocus}
          className="p-1 rounded hover:bg-white/20 text-white/70 hover:text-white transition-colors"
          title={isFocused ? '원래 크기로' : '크게 보기'}>
          {isFocused ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
        <button onClick={onOpenChat}
          className="p-1 rounded hover:bg-white/20 text-white/70 hover:text-white transition-colors"
          title="채팅 열기">
          <MessageSquare className="w-3.5 h-3.5" />
        </button>
        <a href={liveUrl} target="_blank" rel="noopener noreferrer"
          className="p-1 rounded hover:bg-white/20 text-white/70 hover:text-white transition-colors">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <button onClick={onHide}
          className="p-1 rounded hover:bg-red-500/40 text-white/50 hover:text-white transition-colors"
          title="패널 숨기기">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-white text-[10px] font-black">{streamer.name}</span>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────
export default function MultiView({ schedule }: MultiViewProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [phase, setPhase] = useState<'select' | 'watch'>('select');
  const [order, setOrder] = useState<string[]>(schedule.participants.map((p) => p.id));
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [chatStreamerId, setChatStreamerId] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setToast(true), 800);
    const hide = setTimeout(() => setToast(false), 6800);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, []);

  const handleStart = (selectedIds: string[]) => {
    setVisible(new Set(selectedIds));
    setLoaded(new Set(selectedIds));
    setPhase('watch');
  };

  const hidePanel = (id: string) => {
    setVisible((prev) => { const n = new Set(prev); n.delete(id); return n; });
    setLoaded((prev) => { const n = new Set(prev); n.delete(id); return n; });
    if (focusedId === id) setFocusedId(null);
    if (chatStreamerId === id) setChatStreamerId(null);
  };

  const restore = (id: string) => setVisible((prev) => new Set([...prev, id]));
  const load = (id: string) => setLoaded((prev) => new Set([...prev, id]));
  const loadAll = () => setLoaded(new Set([...visible]));

  const swapVisible = (id: string, dir: -1 | 1) => {
    const visIdx = orderedVisible.findIndex((p) => p.id === id);
    const targetIdx = visIdx + dir;
    if (targetIdx < 0 || targetIdx >= orderedVisible.length) return;
    const targetId = orderedVisible[targetIdx].id;
    setOrder((prev) => {
      const next = [...prev];
      const a = next.indexOf(id);
      const b = next.indexOf(targetId);
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
  };

  const openAll = () => {
    schedule.participants
      .filter((s) => visible.has(s.id))
      .forEach((s) => window.open(getLiveUrl(s), '_blank', 'noopener,noreferrer'));
  };

  const orderedVisible = order
    .filter((id) => visible.has(id))
    .map((id) => schedule.participants.find((p) => p.id === id))
    .filter((p): p is Streamer => !!p);

  const hiddenInWatch = phase === 'watch'
    ? schedule.participants.filter((p) => !visible.has(p.id))
    : [];

  const allLoaded = orderedVisible.length > 0 && orderedVisible.every((s) => loaded.has(s.id));
  const focusedStreamer = focusedId ? orderedVisible.find((p) => p.id === focusedId) ?? null : null;
  const otherStreamers = focusedStreamer ? orderedVisible.filter((p) => p.id !== focusedId) : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      {/* 헤더 */}
      <div className="shrink-0 flex items-center gap-2 px-3 h-12 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800">
        {phase === 'select' ? (
          <Link href={`/calendar/schedule/${schedule.id}`}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        ) : (
          <button
            onClick={() => { setPhase('select'); setLoaded(new Set()); setFocusedId(null); setChatStreamerId(null); }}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
            title="스트리머 다시 선택"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <LayoutGrid className="w-4 h-4 text-indigo-400 shrink-0" />
        <span className="text-sm font-black text-white truncate min-w-0 flex-1">{schedule.title}</span>

        {/* 숨겨진 스트리머 복원 칩 */}
        {phase === 'watch' && (
          <AnimatePresence mode="popLayout">
            {hiddenInWatch.map((s) => {
              const color = getStreamerColor(s.id, isDark) ?? s.colorCode;
              return (
                <motion.button
                  key={s.id}
                  layout
                  initial={{ scale: 0.75, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.75, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={() => restore(s.id)}
                  className="flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-full text-[10px] font-black text-white shrink-0 hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: color }}
                  title={`${s.name} 복원`}
                >
                  <Plus className="w-3 h-3" />
                  <span className="hidden sm:inline">{s.name}</span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        )}

        {phase === 'watch' && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={allLoaded ? () => setLoaded(new Set()) : loadAll}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-black rounded-lg transition-colors">
              <Play className="w-3 h-3" />
              <span className="hidden sm:inline">{allLoaded ? '모두 끄기' : '모두 시작'}</span>
            </button>
            <button onClick={openAll}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-lg transition-colors">
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">전체 열기</span>
            </button>
          </div>
        )}
      </div>

      {/* 토스트 */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="fixed bottom-6 right-4 sm:right-6 z-200 max-w-xs w-[calc(100vw-2rem)] sm:w-80"
          >
            <div className="bg-slate-800 border border-slate-700 rounded-[1.75rem] shadow-2xl shadow-black/60 p-4 flex items-start gap-3.5">
              <div className="shrink-0 p-2 bg-amber-500/15 text-amber-400 rounded-2xl">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white mb-0.5">실험중인 기능입니다</p>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  오류 제보 및 피드백은 환영합니다 :)
                </p>
              </div>
              <button onClick={() => setToast(false)}
                className="shrink-0 p-1.5 text-slate-600 hover:text-slate-400 hover:bg-slate-700 rounded-xl transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 콘텐츠 */}
      <AnimatePresence mode="wait">
        {phase === 'select' ? (
          <motion.div
            key="select"
            className="flex-1 flex flex-col min-h-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <SelectionScreen
              schedule={schedule}
              participants={schedule.participants}
              isDark={isDark}
              onStart={handleStart}
            />
          </motion.div>
        ) : (
          <motion.div
            key="watch"
            className="flex-1 flex min-h-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex-1 flex flex-col min-h-0 min-w-0">
              {orderedVisible.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-600">
                  <LayoutGrid className="w-10 h-10" />
                  <p className="text-sm font-black">표시할 패널이 없습니다</p>
                  <p className="text-xs font-medium text-slate-700">위의 칩을 눌러 스트리머를 복원하세요</p>
                </div>
              ) : focusedStreamer ? (
                <ResizableFocusLayout
                  focused={focusedStreamer}
                  others={otherStreamers}
                  renderPanel={(streamer, isFocused) => (
                    <StreamPanel
                      streamer={streamer}
                      color={getStreamerColor(streamer.id, isDark) ?? streamer.colorCode}
                      isLoaded={loaded.has(streamer.id)}
                      isFocused={isFocused}
                      canLeft={orderedVisible.indexOf(streamer) > 0}
                      canRight={orderedVisible.indexOf(streamer) < orderedVisible.length - 1}
                      onLoad={() => load(streamer.id)}
                      onHide={() => hidePanel(streamer.id)}
                      onFocus={() => setFocusedId(streamer.id)}
                      onUnfocus={() => setFocusedId(null)}
                      onSwapLeft={() => swapVisible(streamer.id, -1)}
                      onSwapRight={() => swapVisible(streamer.id, 1)}
                      onOpenChat={() => setChatStreamerId(streamer.id)}
                    />
                  )}
                />
              ) : (
                <ResizableGrid
                  rows={getPanelRows(orderedVisible)}
                  renderPanel={(streamer) => (
                    <StreamPanel
                      streamer={streamer}
                      color={getStreamerColor(streamer.id, isDark) ?? streamer.colorCode}
                      isLoaded={loaded.has(streamer.id)}
                      isFocused={false}
                      canLeft={orderedVisible.indexOf(streamer) > 0}
                      canRight={orderedVisible.indexOf(streamer) < orderedVisible.length - 1}
                      onLoad={() => load(streamer.id)}
                      onHide={() => hidePanel(streamer.id)}
                      onFocus={() => setFocusedId(streamer.id)}
                      onUnfocus={() => {}}
                      onSwapLeft={() => swapVisible(streamer.id, -1)}
                      onSwapRight={() => swapVisible(streamer.id, 1)}
                      onOpenChat={() => setChatStreamerId(streamer.id)}
                    />
                  )}
                />
              )}
            </div>
            {chatStreamerId && (
              <ChatPanel
                streamers={orderedVisible}
                chatStreamerId={chatStreamerId}
                onClose={() => setChatStreamerId(null)}
                onSwitch={setChatStreamerId}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
