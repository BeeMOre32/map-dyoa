'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Loader2, Volume2, VolumeX } from 'lucide-react';
import type { Streamer } from '@prisma/client';
import { CHROME_EXTENSION_URL } from '@/constants/extension';
import {
  getChannelUrl,
  getPreviewLiveUrl,
  postToChzzkIframe,
} from '@/components/multiview/utils';
import { getStreamerImagePath } from '@/lib/utils';
import { probeMapDyoaExtension } from '@/lib/chrome-extension-probe';

const EMBED_VW = 1280;
const EMBED_VH = 720;
/** preview-ready 수신 시 최소 가림 */
const VEIL_MIN_READY_MS = 350;
/** iframe 안 확장 신호·ready가 없을 때만 소극적 안내 */
const READY_FALLBACK_MS = 4500;
/** 미리보기 고정 작은 음량 (슬라이더 없음) */
const PREVIEW_QUIET_VOLUME = 0.15;

type EmbedPhase = 'probing' | 'invite' | 'loading' | 'ready';

type Props = {
  streamer: Streamer;
  className?: string;
  showMeta?: boolean;
  onMeta?: (meta: { title: string | null; category: string | null }) => void;
};

/** 확장 미설치 — 광고형 CTA 없이 포스터 + 짧은 안내만 */
function InviteCard({
  streamer,
  posterSrc,
  className,
}: {
  streamer: Streamer;
  posterSrc: string;
  className: string;
}) {
  const channelUrl = getChannelUrl(streamer);
  return (
    <div
      className={`relative flex aspect-video flex-col justify-end overflow-hidden bg-[#121214] ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={posterSrc}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-55"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      <div className="relative z-10 space-y-1 px-3 pb-3 pt-8">
        <p className="truncate text-[12px] font-bold text-white/90">{streamer.name}</p>
        <p className="text-[10px] font-medium leading-relaxed text-white/45">
          미리보기는{' '}
          <a
            href={CHROME_EXTENSION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/55 underline decoration-white/25 underline-offset-2 hover:text-white/80"
          >
            확장
          </a>
          이 있으면 재생됩니다 ·{' '}
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/55 underline decoration-white/25 underline-offset-2 hover:text-white/80"
          >
            치지직에서 보기
          </a>
        </p>
      </div>
    </div>
  );
}

export default function StreamerLiveEmbed({
  streamer,
  className = '',
  showMeta = true,
  onMeta,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [embedScale, setEmbedScale] = useState(0.375);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [phase, setPhase] = useState<EmbedPhase>('probing');
  const [veil, setVeil] = useState(true);
  const veilOpenedAt = useRef(0);
  const extensionPresentRef = useRef(false);
  const readyRef = useRef(false);
  const veilLiftedRef = useRef(false);
  const [muted, setMuted] = useState(true);
  const [category, setCategory] = useState<string | null>(null);

  const liveUrl = getPreviewLiveUrl(streamer);
  const metaUrl = streamer.chzzkUrl ?? `https://chzzk.naver.com/${streamer.handle}`;
  const posterSrc = streamer.profileImg ?? getStreamerImagePath(streamer.name);
  const onMetaRef = useRef(onMeta);
  onMetaRef.current = onMeta;

  const canMountIframe = phase === 'loading' || phase === 'ready';

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth || EMBED_VW * 0.375;
      setEmbedScale(w / EMBED_VW);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [canMountIframe]);

  useEffect(() => {
    let cancelled = false;
    setCategory(null);
    onMetaRef.current?.({ title: null, category: null });
    void fetch(`/api/chzzk/live-meta?url=${encodeURIComponent(metaUrl)}`, {
      cache: 'no-store',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (json: { title?: string | null; category?: string | null } | null) => {
          if (cancelled || !json) return;
          const title = json.title?.trim() || null;
          const cat = json.category?.trim() || null;
          if (cat) setCategory(cat);
          onMetaRef.current?.({ title, category: cat });
        },
      )
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [metaUrl]);

  // 1) 확장 선확인 — 실패해도 iframe은 시도 (언팩 ID·프로브 오탐 대비)
  useEffect(() => {
    let cancelled = false;
    setPhase('probing');
    void probeMapDyoaExtension().then((result) => {
      if (cancelled) return;
      if (result.installed) extensionPresentRef.current = true;
      setPhase('loading');
      setVeil(true);
    });
    return () => {
      cancelled = true;
    };
  }, [liveUrl]);

  // 2) 확장 확인된 뒤에만 iframe 라이프사이클 (loading 진입 시 1회)
  useEffect(() => {
    if (phase !== 'loading') return;

    setIframeLoaded(false);
    setVeil(true);
    setMuted(true);
    readyRef.current = false;
    veilLiftedRef.current = false;
    veilOpenedAt.current = Date.now();

    const liftVeil = () => {
      if (veilLiftedRef.current) return;
      veilLiftedRef.current = true;
      const elapsed = Date.now() - veilOpenedAt.current;
      const wait = Math.max(0, VEIL_MIN_READY_MS - elapsed);
      window.setTimeout(() => {
        setVeil(false);
        setPhase('ready');
      }, wait);
    };

    const onMsg = (ev: MessageEvent) => {
      if (ev.data?.source !== 'map-dyoa-chzzk') return;
      if (ev.data?.type === 'extension-present' || ev.data?.type === 'pong') {
        extensionPresentRef.current = true;
      }
      if (ev.data?.type === 'preview-ready') {
        extensionPresentRef.current = true;
        readyRef.current = true;
        liftVeil();
      }
    };
    window.addEventListener('message', onMsg);

    const timers = [
      window.setTimeout(() => postToChzzkIframe(iframeRef.current, 'ping'), 400),
      window.setTimeout(() => postToChzzkIframe(iframeRef.current, 'ping'), 1200),
      // 초기에만 음소거 자동재생 — 이후엔 사용자가 켠 소리를 덮어쓰지 않음
      window.setTimeout(() => {
        postToChzzkIframe(iframeRef.current, 'toggle-mute', { muted: true });
        postToChzzkIframe(iframeRef.current, 'fill-player');
      }, 500),
      window.setTimeout(() => {
        postToChzzkIframe(iframeRef.current, 'fill-player');
      }, 1500),
      window.setTimeout(() => {
        postToChzzkIframe(iframeRef.current, 'fill-player');
      }, 2800),
      window.setTimeout(() => {
        if (readyRef.current || veilLiftedRef.current) return;
        if (extensionPresentRef.current) {
          readyRef.current = true;
          liftVeil();
          return;
        }
        setPhase('invite');
      }, READY_FALLBACK_MS),
    ];

    return () => {
      window.removeEventListener('message', onMsg);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [liveUrl, phase]);

  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (nextMuted) {
      postToChzzkIframe(iframeRef.current, 'toggle-mute', { muted: true });
    } else {
      // 슬라이더 없이 항상 작은 음량으로만 켬
      postToChzzkIframe(iframeRef.current, 'set-volume', {
        volume: PREVIEW_QUIET_VOLUME,
      });
      postToChzzkIframe(iframeRef.current, 'toggle-mute', { muted: false });
      window.setTimeout(() => {
        postToChzzkIframe(iframeRef.current, 'set-volume', {
          volume: PREVIEW_QUIET_VOLUME,
        });
      }, 150);
    }
  };

  if (phase === 'probing') {
    return (
      <div
        className={`relative flex aspect-video items-center justify-center overflow-hidden bg-[#121214] ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={posterSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35 blur-[2px]"
        />
        <div className="absolute inset-0 bg-black/50" />
        <Loader2 className="relative z-10 h-6 w-6 animate-spin text-white/40" />
      </div>
    );
  }

  if (phase === 'invite') {
    return (
      <InviteCard streamer={streamer} posterSrc={posterSrc} className={className} />
    );
  }

  return (
    <div
      ref={stageRef}
      className={`group/video relative aspect-video overflow-hidden bg-black ${className}`}
    >
      <iframe
        ref={iframeRef}
        src={liveUrl}
        title={`${streamer.name} 라이브`}
        className={`pointer-events-none absolute left-0 top-0 max-w-none border-0 transition-opacity duration-500 ${
          veil ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          width: EMBED_VW,
          height: EMBED_VH,
          transform: `scale(${embedScale})`,
          transformOrigin: 'top left',
        }}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        scrolling="no"
        tabIndex={-1}
        onLoad={() => {
          setIframeLoaded(true);
          postToChzzkIframe(iframeRef.current, 'toggle-mute', { muted: true });
          postToChzzkIframe(iframeRef.current, 'fill-player');
          postToChzzkIframe(iframeRef.current, 'ping');
        }}
      />

      <div
        className={`absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-[#0e0e10] transition-opacity duration-300 ${
          veil ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!veil}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={posterSrc}
          alt=""
          className="absolute inset-0 h-full w-full scale-105 object-cover opacity-45 blur-[3px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/40" />
        <Loader2 className="relative z-10 h-7 w-7 animate-spin text-red-500" />
        <p className="relative z-10 text-[12px] font-bold text-white/70">
          {iframeLoaded ? '화면 정리 중…' : '미리보기 불러오는 중…'}
        </p>
      </div>

      {/* 음소거 토글만 — 켤 때 고정 작은 음량 */}
      <div
        className={`absolute inset-x-0 bottom-0 z-40 flex items-center gap-2 bg-gradient-to-t from-black/80 to-transparent px-3 py-2.5 transition-opacity duration-150 ${
          veil ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMute();
          }}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-white hover:bg-white/20"
          aria-label={muted ? '소리 켜기 (작게)' : '음소거'}
          title={muted ? '소리 켜기 (작게)' : '음소거'}
        >
          {muted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </button>
        {showMeta ? (
          <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-white/80">
            {streamer.name}
            {category ? <span className="text-white/45"> · {category}</span> : null}
          </span>
        ) : null}
      </div>
    </div>
  );
}
