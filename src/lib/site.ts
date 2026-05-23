import type { Metadata } from 'next';

/** 검색·브랜드 강조용 커뮤니티명 */
export const SITE_BRAND = '지도동';
export const SITE_NAME = 'Map-Dyoa';
/** 홈·캘린더 기본 SEO 타이틀 */
export const SITE_PRIMARY_TITLE = '지도동 방송 일정';
export const SITE_TAGLINE = '지도동 팬 일정';
export const DEFAULT_DESCRIPTION =
  '지도동 멤버의 치지직·유튜브 합방·게임 방송 일정, 클립·스트리머 프로필을 한곳에서 확인하는 지도동 공식 팬 캘린더(Map-Dyoa)입니다.';

/** 페이지 제목에 지도동이 없으면 앞에 붙임 */
export function withSiteBrand(title: string): string {
  if (title.includes(SITE_BRAND)) return title;
  return `${SITE_BRAND} ${title}`;
}

/** `<title>` — 지도동을 앞에, Map-Dyoa는 보조 */
export function formatDocumentTitle(brandedTitle: string): string {
  if (brandedTitle === SITE_PRIMARY_TITLE) return SITE_PRIMARY_TITLE;
  return `${brandedTitle} · ${SITE_NAME}`;
}

/** OG·Twitter — 지도동 브랜드 강조 */
export function formatSocialTitle(brandedTitle: string): string {
  return `${brandedTitle} | ${SITE_BRAND}`;
}

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
  const branded = withSiteBrand(options.title);
  const title = formatDocumentTitle(branded);
  const description = options.description ?? DEFAULT_DESCRIPTION;
  const canonical = options.path ? absoluteUrl(options.path) : undefined;
  const socialTitle = formatSocialTitle(branded);

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    robots: options.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title: socialTitle,
      description,
      type: 'website',
      locale: 'ko_KR',
      siteName: SITE_BRAND,
      url: canonical,
      images: defaultOgImages(socialTitle),
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [DEFAULT_OG_IMAGE_PATH],
    },
  };
}

export function getRootMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  const defaultTitle = SITE_PRIMARY_TITLE;
  const socialTitle = formatSocialTitle(SITE_PRIMARY_TITLE);

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: defaultTitle,
      template: '%s',
    },
    description: DEFAULT_DESCRIPTION,
    keywords: [
      '지도동',
      '지도동 방송',
      '지도동 방송 일정',
      '지도동 일정',
      '지도동 스케줄',
      '지도동 합방',
      '지도동 멤버',
      '지도동 클립',
      '지도동 라이브',
      'Map-Dyoa',
      '스트리머',
      '방송 일정',
      '치지직',
      '유튜브',
      '캘린더',
    ],
    applicationName: SITE_BRAND,
    authors: [{ name: SITE_BRAND }],
    creator: SITE_BRAND,
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
      title: socialTitle,
      description: DEFAULT_DESCRIPTION,
      type: 'website',
      locale: 'ko_KR',
      siteName: SITE_BRAND,
      url: siteUrl,
      images: defaultOgImages(socialTitle),
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
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
    name: SITE_BRAND,
    alternateName: [SITE_PRIMARY_TITLE, SITE_NAME, '지도동 일정', '지도동 스케줄', '지도동 방송'],
    description: DEFAULT_DESCRIPTION,
    url: getSiteUrl(),
    inLanguage: 'ko-KR',
    publisher: {
      '@type': 'Organization',
      name: SITE_BRAND,
      alternateName: [SITE_NAME, SITE_PRIMARY_TITLE],
      url: getSiteUrl(),
    },
  };
}

export function getOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_BRAND,
    alternateName: [SITE_NAME, SITE_PRIMARY_TITLE, '지도동 일정'],
    description: DEFAULT_DESCRIPTION,
    url: getSiteUrl(),
  };
}
