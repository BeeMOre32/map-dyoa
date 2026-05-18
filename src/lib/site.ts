import type { Metadata } from 'next';

export const SITE_NAME = 'Map-Dyoa';
export const SITE_TAGLINE = '지도동 일정 관리';
export const DEFAULT_DESCRIPTION =
  '지도동 멤버의 치지직·유튜브 방송 일정, 스트리머 프로필, 클립을 캘린더로 모아 보는 Map-Dyoa 팬 서비스입니다.';

function normalizeOrigin(url: string): string {
  return url.replace(/\/$/, '');
}

function readPublicSiteUrl(): string | null {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return explicit ? normalizeOrigin(explicit) : null;
}

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]'
  );
}

/** 프로덕션 URL (Vercel: NEXT_PUBLIC_SITE_URL 또는 VERCEL_* 자동) */
export function getSiteUrl(): string {
  const publicUrl = readPublicSiteUrl();
  if (publicUrl) return publicUrl;

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) {
    return normalizeOrigin(
      production.startsWith('http') ? production : `https://${production}`,
    );
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return normalizeOrigin(
      vercel.startsWith('http') ? vercel : `https://${vercel}`,
    );
  }

  return 'http://localhost:3000';
}

/**
 * 링크 복사·네이티브 공유용 (클라이언트).
 * 로컬에서도 NEXT_PUBLIC_SITE_URL(또는 next.config env 주입)이 있으면 프로덕션 도메인 사용.
 */
export function getShareableSiteUrl(): string {
  const publicUrl = readPublicSiteUrl();
  if (publicUrl) return publicUrl;

  if (typeof window !== 'undefined') {
    try {
      const { origin, hostname } = window.location;
      if (!isLocalHostname(hostname)) return origin;
    } catch {
      /* ignore */
    }
  }

  return getSiteUrl();
}

export function buildScheduleShareUrl(scheduleId: string): string {
  const path = `/calendar/schedule/${encodeURIComponent(scheduleId)}`;
  return `${getShareableSiteUrl()}${path}`;
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

/** Next.js 동적 OG 라우트 (1200×630 PNG) */
const DEFAULT_OG_IMAGE_PATH = '/opengraph-image';

function defaultOgImages(alt: string) {
  return [
    {
      url: DEFAULT_OG_IMAGE_PATH,
      width: 1200,
      height: 630,
      alt,
    },
  ];
}

export function buildPageMetadata(options: {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
}): Metadata {
  const description = options.description ?? DEFAULT_DESCRIPTION;
  const canonical = options.path ? absoluteUrl(options.path) : undefined;

  return {
    title: options.title,
    description,
    alternates: canonical ? { canonical } : undefined,
    robots: options.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title: `${options.title} | ${SITE_NAME}`,
      description,
      type: 'website',
      locale: 'ko_KR',
      siteName: SITE_NAME,
      url: canonical,
      images: defaultOgImages(options.title),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${options.title} | ${SITE_NAME}`,
      description,
      images: [DEFAULT_OG_IMAGE_PATH],
    },
  };
}

export function getRootMetadata(): Metadata {
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${SITE_NAME} | ${SITE_TAGLINE}`,
      template: `%s | ${SITE_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    keywords: [
      '지도동',
      '지도동 방송 일정',
      'Map-Dyoa',
      '지도동 일정',
      '스트리머',
      '방송 일정',
      '치지직',
      '유튜브',
      '클립',
      '캘린더',
    ],
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    formatDetection: { email: false, telephone: false },
    manifest: '/manifest.webmanifest',
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/brand/map-dyoa-logo.svg', type: 'image/svg+xml' },
      ],
      apple: [{ url: '/brand/map-dyoa-logo.svg' }],
      shortcut: ['/favicon.svg'],
    },
    openGraph: {
      title: `${SITE_NAME} | ${SITE_TAGLINE}`,
      description: DEFAULT_DESCRIPTION,
      type: 'website',
      locale: 'ko_KR',
      siteName: SITE_NAME,
      url: siteUrl,
      images: defaultOgImages(SITE_NAME),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${SITE_NAME} | ${SITE_TAGLINE}`,
      description: DEFAULT_DESCRIPTION,
      images: [DEFAULT_OG_IMAGE_PATH],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    alternates: {
      canonical: siteUrl,
    },
  };
}

export function getWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: ['지도동', 'Map-Dyoa', '지도동 일정'],
    description: DEFAULT_DESCRIPTION,
    url: getSiteUrl(),
    inLanguage: 'ko-KR',
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: getSiteUrl(),
    },
  };
}
